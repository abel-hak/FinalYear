"""
Leaderboard API - top learners by XP.
Supports all-time, weekly, and monthly rankings.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, func, or_, select

from app.db.session import get_db
from app.core.security import get_current_learner
from app.models.user import User
from app.models.learner import Learner
from app.models.submission import Submission
from pydantic import BaseModel


router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

Period = Literal["all", "weekly", "monthly"]


class LeaderboardEntry(BaseModel):
    rank: int | None = None
    username: str
    total_points: int
    streak_days: int
    quests_completed: int
    is_me: bool = False

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    me: LeaderboardEntry | None = None


@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(10, ge=1, le=50),
    period: Period = Query("all", description="all | weekly | monthly"),
):
    """
    Top learners by XP. Requires auth (learner or admin).
    period=all: lifetime XP; weekly: last 7 days; monthly: last 30 days.
    """
    base_filters = [
        User.role == "learner",
        User.is_deleted.is_(False),
        Learner.is_deleted.is_(False),
        ~User.username.like("hinttest_%"),
        ~User.username.like("ratetest_%"),
    ]

    if period == "all":
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

        # Stable ordering for ties.
        top_result = await db.execute(
            base.order_by(
                Learner.total_points.desc(),
                completed_col.desc(),
                streak_col.desc(),
                User.username.asc(),
            ).limit(limit)
        )
        top_rows = top_result.all()

        me_result = await db.execute(base.where(User.id == user.id).limit(1))
        me_row = me_result.first()

        entries = [
            LeaderboardEntry(
                rank=i + 1,
                username=row.username,
                total_points=int(row.total_points or 0),
                streak_days=int(row.streak_days or 0),
                quests_completed=int(row.completed or 0),
                is_me=(row.user_id == user.id),
            )
            for i, row in enumerate(top_rows)
        ]

        if not me_row:
            return LeaderboardResponse(entries=entries, me=None)

        my_points = int(me_row.total_points or 0)
        my_completed = int(me_row.completed or 0)
        my_streak = int(me_row.streak_days or 0)
        my_username = str(me_row.username)

        # Exact rank with tie-breaks:
        # higher points, then higher completed, then higher streak, then username asc.
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
        ahead_count_result = await db.execute(
            select(func.count(User.id))
            .select_from(User)
            .join(Learner, Learner.user_id == User.id)
            .outerjoin(completed_subq, completed_subq.c.learner_id == Learner.id)
            .where(*base_filters)
            .where(ahead_clause)
        )
        ahead_count = int(ahead_count_result.scalar() or 0)
        me = LeaderboardEntry(
            rank=ahead_count + 1,
            username=my_username,
            total_points=my_points,
            streak_days=my_streak,
            quests_completed=my_completed,
            is_me=True,
        )

        return LeaderboardResponse(entries=entries, me=me)

    # Weekly or monthly: XP from submissions in period (10 XP per quest)
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

    top_result = await db.execute(
        base.order_by(
            period_subq.c.completed.desc(),
            streak_col.desc(),
            User.username.asc(),
        ).limit(limit)
    )
    top_rows = top_result.all()

    me_result = await db.execute(base.where(User.id == user.id).limit(1))
    me_row = me_result.first()

    entries = [
        LeaderboardEntry(
            rank=i + 1,
            username=row.username,
            total_points=int(row.total_points or 0),
            streak_days=int(row.streak_days or 0),
            quests_completed=int(row.completed or 0),
            is_me=(row.user_id == user.id),
        )
        for i, row in enumerate(top_rows)
    ]

    # If the user has no activity in the period, they won't be ranked.
    me = (
        LeaderboardEntry(
            rank=None,
            username=me_row.username,
            total_points=int(me_row.total_points or 0),
            streak_days=int(me_row.streak_days or 0),
            quests_completed=int(me_row.completed or 0),
            is_me=True,
        )
        if me_row
        else LeaderboardEntry(
            rank=None,
            username=user.username,
            total_points=0,
            streak_days=0,
            quests_completed=0,
            is_me=True,
        )
    )

    return LeaderboardResponse(entries=entries, me=me)
