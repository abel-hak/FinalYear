"""Learning path query helpers for learner-facing APIs."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.learning_path import LearningPath, LearningPathQuest
from app.models.submission import Submission


class LearningPathRepository:
    """Encapsulates learning-path read queries."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_paths_with_quests(self) -> list[LearningPath]:
        result = await self.db.execute(
            select(LearningPath)
            .options(
                selectinload(LearningPath.path_quests).selectinload(LearningPathQuest.quest),
                selectinload(LearningPath.checkpoint_quest),
            )
            .order_by(LearningPath.level, LearningPath.order_rank)
        )
        return list(result.scalars().all())

    async def get_path_with_quests(self, path_id) -> LearningPath | None:
        result = await self.db.execute(
            select(LearningPath)
            .options(
                selectinload(LearningPath.path_quests).selectinload(LearningPathQuest.quest),
                selectinload(LearningPath.checkpoint_quest),
            )
            .where(LearningPath.id == path_id)
        )
        return result.scalar_one_or_none()

    async def get_first_path_for_level(self, level: int) -> LearningPath | None:
        result = await self.db.execute(
            select(LearningPath)
            .options(selectinload(LearningPath.path_quests))
            .where(LearningPath.level == level)
            .order_by(LearningPath.order_rank)
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_first_path_for_language_level(
        self, language: str, level: int
    ) -> LearningPath | None:
        """Per-language version of get_first_path_for_level.

        Used by the path-detail unlock check so e.g. Java level 2 only requires
        completion of Java level 1, regardless of any Python-language paths.
        """
        result = await self.db.execute(
            select(LearningPath)
            .options(selectinload(LearningPath.path_quests))
            .where(LearningPath.level == level, LearningPath.language == language)
            .order_by(LearningPath.order_rank)
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_completed_quest_ids_for_learner(self, learner_id) -> set:
        result = await self.db.execute(
            select(Submission.quest_id)
            .where(
                Submission.learner_id == learner_id,
                Submission.passed.is_(True),
            )
            .distinct()
        )
        return {row[0] for row in result.all()}
