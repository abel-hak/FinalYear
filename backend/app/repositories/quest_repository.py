"""Quest and test-case data access helpers."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quest import Quest
from app.models.test_case import TestCase


class QuestRepository:
    """Encapsulates quest and test-case query operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_active_by_id(self, quest_id) -> Quest | None:
        result = await self.db.execute(
            select(Quest).where(Quest.id == quest_id, Quest.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def list_active_test_cases(self, quest_id) -> list[TestCase]:
        result = await self.db.execute(
            select(TestCase).where(TestCase.quest_id == quest_id, TestCase.is_deleted.is_(False))
        )
        return list(result.scalars().all())
