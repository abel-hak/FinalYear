"""Leaderboard query helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learner import Learner
from app.models.quest import Quest
from app.models.submission import Submission
from app.models.user import User


class LeaderboardRepository:
    """Encapsulates leaderboard read queries."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def base_filters() -> list:
        return [
            User.role == "learner",
            User.is_deleted.is_(False),
            Learner.is_deleted.is_(False),
            ~User.username.like("hinttest_%"),
            ~User.username.like("ratetest_%"),
        ]

    async def fetch_all_time_rows(self):
        base_filters = self.base_filters()
        subq = (
            select(
                Submission.learner_id,
                func.count(func.distinct(Submission.quest_id)).label("completed"),
            )
            .where(Submission.passed.is_(True))
            .group_by(Submission.learner_id)
        )
        completed_subq = subq.subquery()

        completed_col = func.coalesce(completed_subq.c.completed, 0)
        streak_col = func.coalesce(Learner.streak_days, 0)

        base = (
            select(
                User.id.label("user_id"),
                User.username,
                Learner.total_points,
                Learner.streak_days,
                completed_col.label("completed"),
            )
            .join(Learner, Learner.user_id == User.id)
            .outerjoin(completed_subq, completed_subq.c.learner_id == Learner.id)
            .where(*base_filters)
        )

        result = await self.db.execute(
            base.order_by(
                Learner.total_points.desc(),
                completed_col.desc(),
                streak_col.desc(),
                User.username.asc(),
            )
        )
        return result.all()

    async def fetch_period_rows(self, *, period: str):
        base_filters = self.base_filters()
        cutoff = datetime.now(timezone.utc) - timedelta(days=7 if period == "weekly" else 30)

        first_pass_subq = (
            select(
                Submission.learner_id,
                Submission.quest_id,
                func.min(Submission.created_at).label("first_pass_at"),
            )
            .where(Submission.passed.is_(True), Submission.created_at >= cutoff)
            .group_by(Submission.learner_id, Submission.quest_id)
        )
        period_subq = first_pass_subq.subquery()
        xp_subq = (
            select(
                period_subq.c.learner_id,
                func.coalesce(func.sum(Quest.xp_reward), 0).label("total_points"),
                func.count(period_subq.c.quest_id).label("completed"),
            )
            .select_from(period_subq)
            .join(Quest, Quest.id == period_subq.c.quest_id)
            .where(period_subq.c.first_pass_at >= cutoff)
            .group_by(period_subq.c.learner_id)
        ).subquery()
        streak_col = func.coalesce(Learner.streak_days, 0)

        base = (
            select(
                User.id.label("user_id"),
                User.username,
                func.coalesce(xp_subq.c.total_points, 0).label("total_points"),
                Learner.streak_days,
                func.coalesce(xp_subq.c.completed, 0).label("completed"),
            )
            .join(Learner, Learner.user_id == User.id)
            .outerjoin(xp_subq, xp_subq.c.learner_id == Learner.id)
            .where(*base_filters)
        )

        result = await self.db.execute(
            base.order_by(
                func.coalesce(xp_subq.c.total_points, 0).desc(),
                func.coalesce(xp_subq.c.completed, 0).desc(),
                streak_col.desc(),
                User.username.asc(),
            )
        )
        return result.all()
