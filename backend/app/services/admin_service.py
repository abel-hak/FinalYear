"""Admin orchestration service for tested management flows."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

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
from app.services.points_service import PointsService


@dataclass
class AdminConflictError(Exception):
    message: str


@dataclass
class AdminNotFoundError(Exception):
    message: str


@dataclass
class AdminValidationError(Exception):
    message: str


class AdminService:
    """Application service for admin management use-cases."""

    def __init__(self, db: AsyncSession) -> None:
        self.repo = AdminRepository(db)
        self.points_service = PointsService(db)

    async def list_quests(self):
        return await self.repo.list_quests_ordered()

    async def create_quest(self, payload):
        existing = await self.repo.find_active_quest_with_order(payload.order_rank)
        if existing:
            raise AdminConflictError(
                f"Order {payload.order_rank} is already used by another quest. Choose a different order."
            )
        return await self.repo.create_quest(payload=payload)

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

    async def list_learning_paths(self) -> list[LearningPathAdmin]:
        paths = await self.repo.list_learning_paths_with_quests()
        return [
            LearningPathAdmin(
                id=path.id,
                title=path.title,
                description=path.description,
                level=path.level,
                order_rank=path.order_rank,
                quest_count=len(path.path_quests),
            )
            for path in paths
        ]

    async def create_learning_path(self, payload) -> LearningPathAdmin:
        path = await self.repo.create_learning_path(payload=payload)
        return LearningPathAdmin(
            id=path.id,
            title=path.title,
            description=path.description,
            level=path.level,
            order_rank=path.order_rank,
            quest_count=0,
        )

    async def update_learning_path(self, *, path_id, payload) -> LearningPathAdmin:
        path = await self.repo.get_learning_path_with_quests(path_id)
        if not path:
            raise AdminNotFoundError("Learning path not found")

        updated = await self.repo.update_learning_path(
            path=path,
            updates=payload.model_dump(exclude_unset=True),
        )
        return LearningPathAdmin(
            id=updated.id,
            title=updated.title,
            description=updated.description,
            level=updated.level,
            order_rank=updated.order_rank,
            quest_count=len(updated.path_quests),
        )

    async def delete_learning_path(self, *, path_id) -> None:
        path = await self.repo.get_learning_path_with_quests(path_id)
        if not path:
            raise AdminNotFoundError("Learning path not found")
        await self.repo.delete_learning_path(path=path)

    async def list_learning_path_quests(self, *, path_id) -> list[LearningPathQuestAdmin]:
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

    async def add_quest_to_learning_path(self, *, path_id, payload) -> LearningPathQuestAdmin:
        path = await self.repo.get_learning_path_with_quests(path_id)
        if not path:
            raise AdminNotFoundError("Learning path not found")

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

    async def remove_quest_from_learning_path(self, *, path_id, quest_id) -> None:
        path_quest = await self.repo.get_learning_path_quest(path_id=path_id, quest_id=quest_id)
        if not path_quest:
            raise AdminNotFoundError("Quest not in this path")
        await self.repo.delete_learning_path_quest(path_quest=path_quest)

    async def update_quest(self, *, quest_id, payload):
        quest = await self.repo.get_quest_by_id(quest_id)
        if not quest:
            raise AdminNotFoundError("Quest not found")
        return await self.repo.update_quest(quest=quest, updates=payload.model_dump(exclude_unset=True))

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
        draft = await draft_fn(
            topic=payload.topic,
            difficulty=payload.difficulty,
            bug_type=payload.bug_type,
            extra_instructions=payload.extra_instructions,
        )

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
