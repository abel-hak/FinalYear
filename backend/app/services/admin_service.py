"""Admin orchestration service for tested management flows."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.admin_repository import AdminRepository
from app.schemas.admin import AdminUserProgress, LearningPathAdmin, LearningPathQuestAdmin


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
                    xp_earned=learner.total_points,
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
