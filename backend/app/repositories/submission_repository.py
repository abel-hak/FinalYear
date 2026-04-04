"""Submission data access helpers."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.submission import Submission


class SubmissionRepository:
    """Encapsulates submission reads and writes."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def count_recent_for_learner(self, learner_id, cutoff) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Submission)
            .where(Submission.learner_id == learner_id, Submission.created_at >= cutoff)
        )
        return int(result.scalar() or 0)

    async def has_passed_for_learner_quest(self, learner_id, quest_id) -> bool:
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

    def add_submission(self, *, learner_id, quest_id, code: str, passed: bool, output_log: str) -> None:
        self.db.add(
            Submission(
                learner_id=learner_id,
                quest_id=quest_id,
                code=code,
                passed=passed,
                output_log=output_log,
            )
        )
