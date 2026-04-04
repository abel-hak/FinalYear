"""Admin orchestration service for tested management flows."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.admin_repository import AdminRepository
from app.schemas.admin import AdminUserProgress


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
