"""Quest submission service orchestration."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.code_runner import CodeRunner, CodeRunnerError, get_code_runner
from app.repositories.learner_repository import LearnerRepository
from app.repositories.quest_repository import QuestRepository
from app.repositories.submission_repository import SubmissionRepository
from app.schemas.execute import SubmissionRequest, SubmissionResult, TestCaseResult


@dataclass
class SubmissionQuestNotFoundError(Exception):
    message: str


@dataclass
class SubmissionSystemBusyError(Exception):
    message: str


@dataclass
class SubmissionRateLimitError(Exception):
    message: str


class QuestSubmissionService:
    """Application service for quest code submission workflow."""

    def __init__(self, db: AsyncSession, *, code_runner: CodeRunner | None = None) -> None:
        self.db = db
        self.learner_repo = LearnerRepository(db)
        self.quest_repo = QuestRepository(db)
        self.submission_repo = SubmissionRepository(db)
        self._code_runner = code_runner

    def _get_runner(self) -> CodeRunner:
        # Resolve lazily so settings changes (e.g. test fixtures) are honored.
        if self._code_runner is None:
            self._code_runner = get_code_runner()
        return self._code_runner

    async def submit(
        self,
        *,
        user_id,
        quest_id,
        payload: SubmissionRequest,
    ) -> SubmissionResult:
        quest = await self.quest_repo.get_active_by_id(quest_id)
        if not quest:
            raise SubmissionQuestNotFoundError("Quest not found")

        test_cases = await self.quest_repo.list_active_test_cases(quest.id)
        if not test_cases:
            # This should not happen in normal operation - all quests must have test cases.
            # If it does, it indicates a data integrity issue (quest misconfigured).
            raise SubmissionQuestNotFoundError("Quest is not properly configured with test cases")

        learner = await self.learner_repo.get_or_create_active_by_user_id(user_id)

        limit = get_settings().submission_rate_limit_per_minute
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
        recent_count = await self.submission_repo.count_recent_for_learner(learner.id, cutoff)
        if recent_count >= limit:
            raise SubmissionRateLimitError(
                f"Rate limit exceeded. Maximum {limit} code submissions per minute. Please wait before trying again."
            )

        # Quests are Python-only until Phase 3 introduces per-quest language.
        language = getattr(quest, "language", None) or "python"

        try:
            sandbox_result = await self._get_runner().run(
                language=language,
                source=payload.code,
                timeout_seconds=5,
            )
        except CodeRunnerError as exc:
            raise SubmissionSystemBusyError("System Busy. Please try again later.") from exc
        except Exception as exc:
            raise SubmissionSystemBusyError("System Busy. Please try again later.") from exc

        tests_total = len(test_cases)
        tests_passed = 0
        actual_output = sandbox_result.stdout or ""
        normalized_actual = actual_output.rstrip("\n")

        test_results: list[TestCaseResult] = []
        if not sandbox_result.timed_out and sandbox_result.exit_code == 0:
            for tc in test_cases:
                expected_raw = tc.expected_output or ""
                expected_norm = expected_raw.rstrip("\n")
                ok = normalized_actual == expected_norm
                if ok:
                    tests_passed += 1
                test_results.append(
                    TestCaseResult(
                        test_case_id=tc.id,
                        passed=ok,
                        expected_output=None if tc.is_hidden else expected_raw,
                        is_hidden=bool(tc.is_hidden),
                    )
                )
        else:
            for tc in test_cases:
                test_results.append(
                    TestCaseResult(
                        test_case_id=tc.id,
                        passed=False,
                        expected_output=None if tc.is_hidden else (tc.expected_output or ""),
                        is_hidden=bool(tc.is_hidden),
                    )
                )

        passed = tests_passed == tests_total and tests_total > 0

        already_completed = await self.submission_repo.has_passed_for_learner_quest(learner.id, quest.id)

        self.submission_repo.add_submission(
            learner_id=learner.id,
            quest_id=quest.id,
            code=payload.code,
            passed=passed,
            output_log=(sandbox_result.stdout or "") + (sandbox_result.stderr or ""),
        )

        if passed and not already_completed:
            base_xp = int(getattr(quest, "xp_reward", 10) or 0)
            # Count failed attempts before this successful submission
            failed_count = await self.submission_repo.count_failed_attempts_before_pass(learner.id, quest.id)
            # Apply penalty: deduct 1 XP per failed attempt, but never award less than 1 XP
            final_xp = max(1, base_xp - failed_count)
            learner.total_points += final_xp
            if quest.level > learner.current_level:
                learner.current_level = quest.level

        today = datetime.now(timezone.utc).date()
        last = learner.last_activity_date
        if last is None:
            learner.streak_days = 1
            learner.last_activity_date = today
        elif last == today:
            pass
        elif last == today - timedelta(days=1):
            learner.streak_days += 1
            learner.last_activity_date = today
        else:
            learner.streak_days = 1
            learner.last_activity_date = today

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            raise SubmissionSystemBusyError("System Busy. Please try again later.") from exc

        return SubmissionResult(
            quest_id=quest.id,
            passed=passed,
            tests_passed=tests_passed,
            tests_total=tests_total,
            stdout=sandbox_result.stdout,
            stderr=sandbox_result.stderr,
            actual_output=actual_output,
            test_results=test_results,
        )
