"""Leaderboard query helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learner import Learner
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

    async def fetch_all_time_rows(self, *, limit: int):
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

        top_result = await self.db.execute(
            base.order_by(
                Learner.total_points.desc(),
                completed_col.desc(),
                streak_col.desc(),
                User.username.asc(),
            ).limit(limit)
        )
        return top_result.all(), base, completed_col, streak_col, completed_subq

    async def fetch_me_all_time(self, *, base, user_id):
        me_result = await self.db.execute(base.where(User.id == user_id).limit(1))
        return me_result.first()

    async def count_ahead_all_time(
        self,
        *,
        completed_col,
        streak_col,
        completed_subq,
        my_points: int,
        my_completed: int,
        my_streak: int,
        my_username: str,
    ) -> int:
        base_filters = self.base_filters()
        ahead_clause = or_(
            Learner.total_points > my_points,
            and_(Learner.total_points == my_points, completed_col > my_completed),
            and_(
                Learner.total_points == my_points,
                completed_col == my_completed,
                streak_col > my_streak,
            ),
            and_(
                Learner.total_points == my_points,
                completed_col == my_completed,
                streak_col == my_streak,
                User.username < my_username,
            ),
        )

        result = await self.db.execute(
            select(func.count(User.id))
            .select_from(User)
            .join(Learner, Learner.user_id == User.id)
            .outerjoin(completed_subq, completed_subq.c.learner_id == Learner.id)
            .where(*base_filters)
            .where(ahead_clause)
        )
        return int(result.scalar() or 0)

    async def fetch_period_rows(self, *, period: str, limit: int):
        base_filters = self.base_filters()
        cutoff = datetime.now(timezone.utc) - timedelta(days=7 if period == "weekly" else 30)

        subq = (
            select(
                Submission.learner_id,
                func.count(func.distinct(Submission.quest_id)).label("completed"),
            )
            .where(Submission.passed.is_(True), Submission.created_at >= cutoff)
            .group_by(Submission.learner_id)
        )
        period_subq = subq.subquery()
        streak_col = func.coalesce(Learner.streak_days, 0)

        base = (
            select(
                User.id.label("user_id"),
                User.username,
                (period_subq.c.completed * 10).label("total_points"),
                Learner.streak_days,
                period_subq.c.completed.label("completed"),
            )
            .join(Learner, Learner.user_id == User.id)
            .join(period_subq, period_subq.c.learner_id == Learner.id)
            .where(*base_filters)
        )

        top_result = await self.db.execute(
            base.order_by(
                period_subq.c.completed.desc(),
                streak_col.desc(),
                User.username.asc(),
            ).limit(limit)
        )
        top_rows = top_result.all()
        return top_rows, base

    async def fetch_me_period(self, *, base, user_id):
        me_result = await self.db.execute(base.where(User.id == user_id).limit(1))
        return me_result.first()
