"""Admin orchestration service for tested management flows."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import hashlib
import logging
import secrets

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.repositories.admin_repository import AdminRepository
from app.schemas.ai_admin import AdminQuestAIDraftRequest, AdminQuestAIDraftResponse
from app.schemas.admin import (
    AdminAnalytics,
    AdminDailyActivity,
    AdminDifficultyDistribution,
    AdminQuestCompletion,
    AdminStats,
    AdminUserProgress,
    LearningPathAdmin,
    LearningPathQuestAdmin,
    QuestQualityIssue,
    QuestQualityReport,
)
from app.services.email_service import SmtpEmailService
from app.services.points_service import PointsService


logger = logging.getLogger(__name__)


@dataclass
class AdminConflictError(Exception):
    message: str


@dataclass
class AdminNotFoundError(Exception):
    message: str


@dataclass
class AdminValidationError(Exception):
    message: str


@dataclass
class AdminPermissionError(Exception):
    message: str


class AdminService:
    """Application service for admin management use-cases."""

    def __init__(self, db: AsyncSession) -> None:
        self.repo = AdminRepository(db)
        self.points_service = PointsService(db)
        self.email_service = SmtpEmailService()

    def _serialize_learning_path(self, path) -> LearningPathAdmin:
        return LearningPathAdmin(
            id=path.id,
            title=path.title,
            description=path.description,
            level=path.level,
            order_rank=path.order_rank,
            language=getattr(path, "language", None) or "python",
            quest_count=len(path.path_quests),
            checkpoint_quest_id=getattr(path, "checkpoint_quest_id", None),
            creator_user_id=getattr(path, "creator_user_id", None),
            creator_email=getattr(getattr(path, "creator", None), "email", None),
        )

    def _ensure_creator_access(self, path, creator_user_id) -> None:
        if creator_user_id is None:
            return
        if getattr(path, "creator_user_id", None) != creator_user_id:
            raise AdminPermissionError("Creator access required for this learning path")

    async def list_quests(self):
        return await self.repo.list_quests_ordered()

    async def create_quest(self, payload, creator_user_id=None):
        existing = await self.repo.find_active_quest_with_order(payload.order_rank)
        if existing:
            raise AdminConflictError(
                f"Order {payload.order_rank} is already used by another quest. Choose a different order."
            )

        # If a learning_path_id is provided, validate path existence and creator access
        path = None
        if getattr(payload, "learning_path_id", None):
            lp_id = payload.learning_path_id
            if creator_user_id is not None:
                path = await self.repo.get_learning_path_with_quests_for_creator(lp_id, creator_user_id)
                if not path:
                    raise AdminPermissionError("Creator access required for this learning path")
            else:
                path = await self.repo.get_learning_path_with_quests(lp_id)
                if not path:
                    raise AdminNotFoundError("Learning path not found")

        quest = await self.repo.create_quest(payload=payload)

        # If a path was provided, attach the created quest to it
        if path is not None:
            max_rank = max((pq.order_rank for pq in path.path_quests), default=0)
            order_rank = max_rank + 1
            await self.repo.add_learning_path_quest(path_id=path.id, quest_id=quest.id, order_rank=order_rank)

        return quest

    async def list_users(self) -> list[AdminUserProgress]:
        total_quests = await self.repo.count_active_quests()
        rows = await self.repo.list_active_learner_pairs()

        out: list[AdminUserProgress] = []
        for user, learner in rows:
            quests_completed = await self.repo.count_completed_quests_for_learner(learner.id)
            last_active = await self.repo.get_last_submission_at(learner.id)
            out.append(
                AdminUserProgress(
                    id=str(user.id),
                    username=user.username,
                    email=user.email,
                    quests_completed=quests_completed,
                    total_quests=total_quests,
                    xp_earned=await self.points_service.get_lifetime_points_for_user(user.id),
                    last_active=last_active,
                )
            )
        return out

    async def purge_submissions(self, retention_days: int) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
        failed_deleted, passed_deleted = await self.repo.purge_submissions_before(cutoff)
        return {"purged": failed_deleted + passed_deleted, "retention_days": retention_days}

    async def remove_learner(self, *, user_id, admin_id):
        row = await self.repo.get_active_user_with_learner(user_id)
        if not row:
            raise AdminNotFoundError("User not found")

        user, learner = row
        if user.role != "learner":
            raise AdminValidationError(
                "Only learners can be removed. Admins cannot be removed via this endpoint."
            )

        await self.repo.soft_delete_learner_user(user=user, learner=learner, admin_id=admin_id)

    async def list_learning_paths(self, creator_user_id=None) -> list[LearningPathAdmin]:
        if creator_user_id is None:
            paths = await self.repo.list_learning_paths_with_quests()
        else:
            paths = await self.repo.list_learning_paths_for_creator(creator_user_id)
        return [self._serialize_learning_path(path) for path in paths]

    async def create_learning_path(self, payload, *, current_admin) -> LearningPathAdmin:
        creator_user_id = None
        creator_email = getattr(payload, "creator_email", None)
        if creator_email and creator_email.lower() == current_admin.email.lower():
            creator_user_id = current_admin.id

        path = await self.repo.create_learning_path(payload=payload, creator_user_id=creator_user_id)

        if creator_email and creator_user_id is None:
            await self._invite_creator_for_path(path=path, creator_email=creator_email, invited_by=current_admin)

        return self._serialize_learning_path(path)

    async def _invite_creator_for_path(self, *, path, creator_email: str, invited_by) -> None:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        settings = get_settings()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.email_verification_otp_ttl_minutes)
        await self.repo.create_creator_invitation(
            path_id=path.id,
            email=creator_email,
            token_hash=token_hash,
            expires_at=expires_at,
            created_by=invited_by.id,
        )
        accept_url = f"{settings.frontend_base_url.rstrip('/')}/creator/invite?token={token}"
        try:
            await self.email_service.send_creator_invitation_email(
                to_email=creator_email,
                username=None,
                accept_url=accept_url,
                path_title=path.title,
                expires_minutes=settings.email_verification_otp_ttl_minutes,
            )
        except Exception as exc:
            logger.warning("Creator invitation saved but email delivery failed for %s: %s", creator_email, exc)

    async def accept_creator_invitation(self, *, token: str, current_user) -> LearningPathAdmin:
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        invitation = await self.repo.find_active_creator_invitation_by_token_hash(token_hash)
        if not invitation:
            raise AdminNotFoundError("Invitation not found or expired")
        if invitation.email.lower() != current_user.email.lower():
            raise AdminValidationError("This invitation was sent to a different email address")
        now = datetime.now(timezone.utc)
        if invitation.expires_at <= now:
            raise AdminNotFoundError("Invitation not found or expired")
        accepted = await self.repo.accept_creator_invitation(invitation=invitation, user_id=current_user.id)
        path = await self.repo.get_learning_path_with_quests(accepted.path_id)
        if not path:
            raise AdminNotFoundError("Learning path not found")
        return self._serialize_learning_path(path)

    async def update_learning_path(self, *, path_id, payload, current_admin) -> LearningPathAdmin:
        path = await self.repo.get_learning_path_with_quests(path_id)
        if not path:
            raise AdminNotFoundError("Learning path not found")

        updates = payload.model_dump(exclude_unset=True)
        creator_email = updates.pop("creator_email", None)
        existing_creator_email = getattr(getattr(path, "creator", None), "email", None)
        if creator_email:
            if existing_creator_email and creator_email.lower() == existing_creator_email.lower():
                creator_email = None
            elif creator_email.lower() == current_admin.email.lower():
                updates["creator_user_id"] = current_admin.id
        updated = await self.repo.update_learning_path(
            path=path,
            updates=updates,
        )
        if creator_email and creator_email.lower() != current_admin.email.lower():
            await self._invite_creator_for_path(path=updated, creator_email=creator_email, invited_by=current_admin)
        return self._serialize_learning_path(updated)

    async def delete_learning_path(self, *, path_id) -> None:
        path = await self.repo.get_learning_path_with_quests(path_id)
        if not path:
            raise AdminNotFoundError("Learning path not found")
        await self.repo.delete_learning_path(path=path)

    async def list_learning_path_quests(self, *, path_id, creator_user_id=None) -> list[LearningPathQuestAdmin]:
        if creator_user_id is not None:
            path = await self.repo.get_learning_path_with_quests_for_creator(path_id, creator_user_id)
            if not path:
                raise AdminNotFoundError("Learning path not found")
        rows = await self.repo.list_learning_path_quests(path_id)
        return [
            LearningPathQuestAdmin(
                id=path_quest.id,
                quest_id=path_quest.quest_id,
                order_rank=path_quest.order_rank,
                quest_title=quest.title,
                quest_level=quest.level,
            )
            for path_quest, quest in rows
        ]

    async def add_quest_to_learning_path(self, *, path_id, payload, creator_user_id=None) -> LearningPathQuestAdmin:
        path = (
            await self.repo.get_learning_path_with_quests_for_creator(path_id, creator_user_id)
            if creator_user_id is not None
            else await self.repo.get_learning_path_with_quests(path_id)
        )
        if not path:
            raise AdminNotFoundError("Learning path not found")
        self._ensure_creator_access(path, creator_user_id)

        quest = await self.repo.get_active_quest(payload.quest_id)
        if not quest:
            raise AdminNotFoundError("Quest not found")

        existing = next((pq for pq in path.path_quests if pq.quest_id == payload.quest_id), None)
        if existing:
            raise AdminConflictError("Quest already in this path")

        max_rank = max((pq.order_rank for pq in path.path_quests), default=0)
        order_rank = payload.order_rank if payload.order_rank is not None else max_rank + 1

        path_quest = await self.repo.add_learning_path_quest(
            path_id=path_id,
            quest_id=payload.quest_id,
            order_rank=order_rank,
        )
        return LearningPathQuestAdmin(
            id=path_quest.id,
            quest_id=path_quest.quest_id,
            order_rank=path_quest.order_rank,
            quest_title=quest.title,
            quest_level=quest.level,
        )

    async def remove_quest_from_learning_path(self, *, path_id, quest_id, creator_user_id=None) -> None:
        path = (
            await self.repo.get_learning_path_with_quests_for_creator(path_id, creator_user_id)
            if creator_user_id is not None
            else await self.repo.get_learning_path_with_quests(path_id)
        )
        if not path:
            raise AdminNotFoundError("Learning path not found")
        self._ensure_creator_access(path, creator_user_id)

        path_quest = await self.repo.get_learning_path_quest(path_id=path_id, quest_id=quest_id)
        if not path_quest:
            raise AdminNotFoundError("Quest not in this path")
        await self.repo.delete_learning_path_quest(path_quest=path_quest)

    async def update_quest(self, *, quest_id, payload, creator_user_id=None):
        quest = await self.repo.get_quest_by_id(quest_id)
        if not quest:
            raise AdminNotFoundError("Quest not found")
        # If a creator invokes this, ensure they manage at least one path containing this quest
        if creator_user_id is not None:
            allowed = await self.repo.is_quest_in_creator_paths(quest_id, creator_user_id)
            if not allowed:
                raise AdminPermissionError("Creator permission required to edit this quest")
        return await self.repo.update_quest(quest=quest, updates=payload.model_dump(exclude_unset=True))

    async def reorder_learning_path_quests(self, *, path_id, payload, creator_user_id=None) -> None:
        # payload is expected to be a list/dict structure with items containing quest_id and order_rank
        path = (
            await self.repo.get_learning_path_with_quests_for_creator(path_id, creator_user_id)
            if creator_user_id is not None
            else await self.repo.get_learning_path_with_quests(path_id)
        )
        if not path:
            raise AdminNotFoundError("Learning path not found")
        self._ensure_creator_access(path, creator_user_id)

        items = getattr(payload, "items", None) or payload
        # normalize to list of dicts
        normalized = []
        for it in items:
            normalized.append({"quest_id": it.quest_id if hasattr(it, "quest_id") else it["quest_id"], "order_rank": it.order_rank if hasattr(it, "order_rank") else it["order_rank"]})

        await self.repo.reorder_learning_path_quests(path_id=path_id, items=normalized)

    async def delete_quest(self, *, quest_id) -> None:
        quest = await self.repo.get_quest_by_id(quest_id)
        if not quest:
            raise AdminNotFoundError("Quest not found")
        await self.repo.soft_delete_quest(quest=quest)

    async def list_test_cases(self, *, quest_id):
        return await self.repo.list_active_test_cases_for_quest(quest_id)

    async def create_test_case(self, *, quest_id, payload):
        quest = await self.repo.get_active_quest(quest_id)
        if not quest:
            raise AdminNotFoundError("Quest not found")
        return await self.repo.create_test_case(
            quest_id=quest.id,
            input_data=payload.input_data,
            expected_output=payload.expected_output,
            is_hidden=payload.is_hidden,
        )

    async def delete_test_case(self, *, test_case_id) -> None:
        test_case = await self.repo.get_test_case_by_id(test_case_id)
        if not test_case:
            raise AdminNotFoundError("Test case not found")
        await self.repo.soft_delete_test_case(test_case=test_case)

    async def get_stats(self) -> AdminStats:
        total_users = await self.repo.count_active_learners()
        total_quests = await self.repo.count_active_quests()
        quests_completed = await self.repo.count_distinct_passed_pairs()

        possible = total_users * total_quests if total_quests else 0
        completion_rate_pct = (quests_completed / possible * 100) if possible else 0.0

        return AdminStats(
            total_users=total_users,
            quests_completed=quests_completed,
            total_quests=total_quests,
            completion_rate_pct=round(completion_rate_pct, 1),
        )

    async def get_analytics(self) -> AdminAnalytics:
        quests = await self.repo.list_active_quests_ordered()

        quest_completion: list[AdminQuestCompletion] = []
        for quest in quests:
            completed = await self.repo.count_submissions_for_quest(quest.id, passed=True)
            failed = await self.repo.count_submissions_for_quest(quest.id, passed=False)
            quest_completion.append(
                AdminQuestCompletion(
                    quest_id=str(quest.id),
                    quest_title=quest.title[:30] + ("..." if len(quest.title) > 30 else ""),
                    completed=completed,
                    failed=failed,
                )
            )

        level_map = {1: "Easy", 2: "Medium", 3: "Hard", 4: "Expert", 5: "Master"}
        difficulty_distribution = [
            AdminDifficultyDistribution(
                level=level,
                label=level_map.get(level, f"Level {level}"),
                count=count,
            )
            for level, count in await self.repo.count_quests_grouped_by_level()
        ]

        now = datetime.now(timezone.utc)
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        weekly_activity: list[AdminDailyActivity] = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            submissions = await self.repo.count_submissions_between(day_start, day_end)
            unique_users = await self.repo.count_unique_submission_learners_between(day_start, day_end)
            weekly_activity.append(
                AdminDailyActivity(
                    day=day_names[day.weekday()],
                    date=day.strftime("%Y-%m-%d"),
                    submissions=submissions,
                    unique_users=unique_users,
                )
            )

        return AdminAnalytics(
            quest_completion=quest_completion,
            difficulty_distribution=difficulty_distribution,
            weekly_activity=weekly_activity,
        )

    async def get_quest_quality_report(self) -> QuestQualityReport:
        quests = await self.repo.list_active_quests_ordered()
        test_case_counts = await self.repo.count_active_test_cases_by_quest()

        items: list[QuestQualityIssue] = []
        for quest in quests:
            issues: list[str] = []
            if not quest.title or not quest.title.strip():
                issues.append("Missing title")
            if not quest.description or not quest.description.strip():
                issues.append("Missing description")
            if not quest.initial_code or not quest.initial_code.strip():
                issues.append("Missing initial_code")
            if not quest.solution_code or not quest.solution_code.strip():
                issues.append("Missing solution_code")
            if not quest.explanation or not quest.explanation.strip():
                issues.append("Missing explanation")
            if not quest.tags or len(quest.tags) == 0:
                issues.append("Missing tags")
            if test_case_counts.get(quest.id, 0) <= 0:
                issues.append("No test cases")

            if issues:
                items.append(
                    QuestQualityIssue(
                        quest_id=quest.id,
                        order_rank=int(quest.order_rank),
                        title=quest.title,
                        issues=issues,
                    )
                )

        return QuestQualityReport(
            total_quests=len(quests),
            quests_with_issues=len(items),
            items=items,
        )

    async def generate_ai_draft(self, *, payload: AdminQuestAIDraftRequest, draft_fn) -> AdminQuestAIDraftResponse:
        try:
            draft = await draft_fn(
                topic=payload.topic,
                difficulty=payload.difficulty,
                bug_type=payload.bug_type,
                language=getattr(payload, "language", None),
                extra_instructions=payload.extra_instructions,
            )
        except Exception as exc:  # pragma: no cover - fallback for misconfigured AI during dev
            logger.warning("AI draft generation failed, falling back to local draft: %s", exc)
            # Provide a deterministic, minimal fallback draft so the API remains usable
            lvl = int(payload.difficulty or 1)
            lvl = 1 if lvl < 1 else 3 if lvl > 3 else lvl
            language = (getattr(payload, "language", None) or "python").strip().lower()
            if language in {"js", "node"}:
                language = "javascript"

            fallback_templates = {
                "python": (
                    "x = 5\nprint(x + 3)\n",
                    "x = 7\nprint(x + 3)\n",
                    "10\n",
                ),
                "javascript": (
                    "const x = 5;\nconsole.log(x + 3);\n",
                    "const x = 7;\nconsole.log(x + 3);\n",
                    "10\n",
                ),
                "typescript": (
                    "const x: number = 5;\nconsole.log(x + 3);\n",
                    "const x: number = 7;\nconsole.log(x + 3);\n",
                    "10\n",
                ),
                "java": (
                    "public class Main {\n    public static void main(String[] args) {\n        int x = 5;\n        System.out.println(x + 3);\n    }\n}\n",
                    "public class Main {\n    public static void main(String[] args) {\n        int x = 7;\n        System.out.println(x + 3);\n    }\n}\n",
                    "10\n",
                ),
                "cpp": (
                    "#include <iostream>\nusing namespace std;\n\nint main() {\n    int x = 5;\n    cout << x + 3 << endl;\n    return 0;\n}\n",
                    "#include <iostream>\nusing namespace std;\n\nint main() {\n    int x = 7;\n    cout << x + 3 << endl;\n    return 0;\n}\n",
                    "10\n",
                ),
                "c": (
                    "#include <stdio.h>\n\nint main(void) {\n    int x = 5;\n    printf(\"%d\\n\", x + 3);\n    return 0;\n}\n",
                    "#include <stdio.h>\n\nint main(void) {\n    int x = 7;\n    printf(\"%d\\n\", x + 3);\n    return 0;\n}\n",
                    "10\n",
                ),
            }
            initial_code, solution_code, expected_output = fallback_templates.get(
                language,
                fallback_templates["python"],
            )
            draft = {
                "title": f"{payload.topic.title()} Debug Quest (auto)",
                "description": f"Find and fix the bug related to {payload.topic}.",
                "level": lvl,
                "initial_code": initial_code,
                "solution_code": solution_code,
                "explanation": "Adjust the value of `x` so the program prints the expected result.",
                "expected_output": expected_output,
                "tags": [payload.topic.lower().replace(" ", "_"), "debug"],
            }

        def _s(key: str) -> str:
            value = draft.get(key, "")
            if not isinstance(value, str):
                return ""
            return value.strip()

        level = int(draft.get("level") or payload.difficulty or 1)
        level = 1 if level < 1 else 3 if level > 3 else level
        tags = draft.get("tags") or []
        if not isinstance(tags, list):
            tags = []
        tags = [str(tag).strip().lower() for tag in tags if str(tag).strip()][:5]

        return AdminQuestAIDraftResponse(
            title=_s("title") or f"{payload.topic.title()} Debug Quest",
            description=_s("description") or f"Fix the bug related to {payload.topic}.",
            level=level,
            initial_code=_s("initial_code"),
            solution_code=_s("solution_code"),
            explanation=_s("explanation"),
            expected_output=_s("expected_output"),
            tags=tags,
        )
