"""Quest/progress query helpers for learner-facing progression views."""

from __future__ import annotations

from datetime import datetime, timezone

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

    async def list_review_candidates_for_learner(self, learner_id, cutoff: datetime):
        # Last passed submission per quest, filtered by spacing interval.
        subq = (
            select(
                Submission.quest_id,
                Submission.created_at.label("last_passed"),
            )
            .where(
                Submission.learner_id == learner_id,
                Submission.passed.is_(True),
                Submission.created_at <= cutoff,
            )
            .distinct(Submission.quest_id)
            .order_by(Submission.quest_id, Submission.created_at.desc())
        ).subquery()

        result = await self.db.execute(
            select(Quest, subq.c.last_passed)
            .join(subq, Quest.id == subq.c.quest_id)
            .where(Quest.is_deleted.is_(False))
            .order_by(subq.c.last_passed.asc())
        )
        rows = []
        for quest, last_passed in result.all():
            if last_passed and last_passed.tzinfo is None:
                last_passed = last_passed.replace(tzinfo=timezone.utc)
            rows.append((quest, last_passed))
        return rows
