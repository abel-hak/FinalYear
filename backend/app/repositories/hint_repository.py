"""Hint request data access helpers."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hint_request import HintRequest


class HintRepository:
    """Encapsulates hint request queries and writes."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def count_for_learner_quest(self, learner_id, quest_id) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(HintRequest)
            .where(HintRequest.learner_id == learner_id, HintRequest.quest_id == quest_id)
        )
        return int(result.scalar() or 0)

    async def add_request(self, learner_id, quest_id) -> None:
        self.db.add(HintRequest(learner_id=learner_id, quest_id=quest_id))
