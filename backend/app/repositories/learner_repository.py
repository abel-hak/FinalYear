"""Learner profile database access."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learner import Learner


class LearnerRepository:
    """Data access for learner profiles."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_active_by_user_id(self, user_id) -> Learner | None:
        result = await self.db.execute(
            select(Learner).where(Learner.user_id == user_id, Learner.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def get_or_create_active_by_user_id(self, user_id) -> Learner:
        learner = await self.get_active_by_user_id(user_id)
        if learner:
            return learner

        learner = Learner(user_id=user_id)
        self.db.add(learner)
        await self.db.flush()
        return learner
