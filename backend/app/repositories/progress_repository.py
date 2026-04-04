"""Quest/progress query helpers for learner-facing progression views."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quest import Quest
from app.models.submission import Submission


class ProgressRepository:
    """Encapsulates queries used in quest/progress services."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_active_quests_ordered(self) -> list[Quest]:
        result = await self.db.execute(
            select(Quest).where(Quest.is_deleted.is_(False)).order_by(Quest.order_rank)
        )
        return list(result.scalars().all())

    async def get_active_quest_by_id(self, quest_id) -> Quest | None:
        result = await self.db.execute(
            select(Quest).where(Quest.id == quest_id, Quest.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def list_active_quest_ids_ordered(self) -> list:
        result = await self.db.execute(
            select(Quest.id).where(Quest.is_deleted.is_(False)).order_by(Quest.order_rank)
        )
        return [row[0] for row in result.all()]

    async def get_completed_quest_ids_for_learner(self, learner_id) -> set:
        result = await self.db.execute(
            select(Submission.quest_id)
            .where(Submission.learner_id == learner_id, Submission.passed.is_(True))
            .distinct()
        )
        return {row[0] for row in result.all()}

    async def has_passed_submission(self, learner_id, quest_id) -> bool:
        result = await self.db.execute(
            select(Submission.id)
            .where(
                Submission.learner_id == learner_id,
                Submission.quest_id == quest_id,
                Submission.passed.is_(True),
            )
            .limit(1)
        )
        return result.scalar_one_or_none() is not None
