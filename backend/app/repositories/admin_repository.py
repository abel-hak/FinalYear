"""Admin-oriented data access helpers for management workflows."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learner import Learner
from app.models.quest import Quest
from app.models.submission import Submission
from app.models.user import User


class AdminRepository:
    """Encapsulates DB operations used by admin services."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_quests_ordered(self):
        result = await self.db.execute(select(Quest).order_by(Quest.order_rank))
        return list(result.scalars().all())

    async def find_active_quest_with_order(self, order_rank: int):
        result = await self.db.execute(
            select(Quest).where(Quest.order_rank == order_rank, Quest.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def create_quest(self, *, payload):
        quest = Quest(
            title=payload.title,
            description=payload.description,
            level=payload.level,
            order_rank=payload.order_rank,
            initial_code=payload.initial_code,
            solution_code=payload.solution_code,
            explanation=payload.explanation,
            tags=payload.tags or [],
        )
        self.db.add(quest)
        await self.db.commit()
        await self.db.refresh(quest)
        return quest

    async def count_active_quests(self) -> int:
        result = await self.db.execute(select(func.count(Quest.id)).where(Quest.is_deleted.is_(False)))
        return int(result.scalar() or 0)

    async def list_active_learner_pairs(self):
        result = await self.db.execute(
            select(User, Learner)
            .join(Learner, Learner.user_id == User.id)
            .where(User.role == "learner", User.is_deleted.is_(False), Learner.is_deleted.is_(False))
        )
        return result.all()

    async def count_completed_quests_for_learner(self, learner_id) -> int:
        result = await self.db.execute(
            select(func.count(Submission.quest_id.distinct())).where(
                Submission.learner_id == learner_id,
                Submission.passed.is_(True),
            )
        )
        return int(result.scalar() or 0)

    async def get_last_submission_at(self, learner_id):
        result = await self.db.execute(
            select(func.max(Submission.created_at)).where(Submission.learner_id == learner_id)
        )
        return result.scalar()

    async def purge_submissions_before(self, cutoff):
        r1 = await self.db.execute(
            text("DELETE FROM submissions WHERE created_at < :cutoff AND passed = false"),
            {"cutoff": cutoff},
        )
        r2 = await self.db.execute(
            text(
                """
                DELETE FROM submissions s
                WHERE s.created_at < :cutoff AND s.passed = true
                AND EXISTS (
                    SELECT 1 FROM submissions s2
                    WHERE s2.learner_id = s.learner_id AND s2.quest_id = s.quest_id
                    AND s2.passed = true AND s2.created_at >= :cutoff
                )
                """
            ),
            {"cutoff": cutoff},
        )
        await self.db.commit()
        return int(getattr(r1, "rowcount", 0) or 0), int(getattr(r2, "rowcount", 0) or 0)

    async def get_active_user_with_learner(self, user_id):
        result = await self.db.execute(
            select(User, Learner)
            .outerjoin(Learner, Learner.user_id == User.id)
            .where(User.id == user_id, User.is_deleted.is_(False))
        )
        return result.one_or_none()

    async def soft_delete_learner_user(self, *, user: User, learner: Learner | None, admin_id):
        now = datetime.now(timezone.utc)
        user.is_deleted = True
        user.deleted_at = now
        user.deleted_by = admin_id

        if learner:
            learner.is_deleted = True
            learner.deleted_at = now
            learner.deleted_by = admin_id

        await self.db.commit()
