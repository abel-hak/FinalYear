"""Achievements query helpers."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.hint_request import HintRequest
from app.models.learner import Learner
from app.models.learning_path import LearningPath
from app.models.quest import Quest
from app.models.submission import Submission


class AchievementRepository:
    """Encapsulates data retrieval for achievement computation."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_active_learner_by_user_id(self, user_id) -> Learner:
        result = await self.db.execute(
            select(Learner).where(Learner.user_id == user_id, Learner.is_deleted.is_(False))
        )
        return result.scalar_one()

    async def list_active_quests_ordered(self) -> list[Quest]:
        result = await self.db.execute(
            select(Quest).where(Quest.is_deleted.is_(False)).order_by(Quest.order_rank)
        )
        return list(result.scalars().all())

    async def list_submissions_for_learner(self, learner_id) -> list[Submission]:
        result = await self.db.execute(
            select(Submission)
            .where(Submission.learner_id == learner_id)
            .order_by(Submission.quest_id, Submission.created_at)
        )
        return list(result.scalars().all())

    async def list_hinted_quest_ids_for_learner(self, learner_id) -> set:
        result = await self.db.execute(
            select(HintRequest.quest_id).where(HintRequest.learner_id == learner_id)
        )
        return {row[0] for row in result.all()}

    async def list_learning_paths_with_quests(self) -> list[LearningPath]:
        result = await self.db.execute(
            select(LearningPath)
            .options(selectinload(LearningPath.path_quests))
            .order_by(LearningPath.level, LearningPath.order_rank)
        )
        return list(result.scalars().all())
