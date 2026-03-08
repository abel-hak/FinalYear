"""
Leaderboard API - top learners by XP.
Supports all-time, weekly, and monthly rankings.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.security import get_current_learner
from app.models.user import User
from app.models.learner import Learner
from app.models.submission import Submission
from pydantic import BaseModel


router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

Period = Literal["all", "weekly", "monthly"]


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    total_points: int
    streak_days: int
    quests_completed: int

    class Config:
        from_attributes = True


@router.get("", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    _user: User = Depends(get_current_learner),
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
            select(Submission.learner_id, func.count(Submission.quest_id.distinct()).label("completed"))
            .where(Submission.passed.is_(True))
            .group_by(Submission.learner_id)
        )
        completed_subq = subq.subquery()
        result = await db.execute(
            select(User.username, Learner.total_points, Learner.streak_days, completed_subq.c.completed)
            .join(Learner, Learner.user_id == User.id)
            .outerjoin(completed_subq, completed_subq.c.learner_id == Learner.id)
            .where(*base_filters)
            .order_by(Learner.total_points.desc())
            .limit(limit)
        )
        rows = result.all()
        return [
            LeaderboardEntry(
                rank=i + 1,
                username=row.username,
                total_points=row.total_points,
                streak_days=row.streak_days or 0,
                quests_completed=row.completed or 0,
            )
            for i, row in enumerate(rows)
        ]

    # Weekly or monthly: XP from submissions in period (10 XP per quest)
    cutoff = datetime.now(timezone.utc) - timedelta(days=7 if period == "weekly" else 30)
    subq = (
        select(
            Submission.learner_id,
            func.count(Submission.quest_id.distinct()).label("completed"),
        )
        .where(Submission.passed.is_(True), Submission.created_at >= cutoff)
        .group_by(Submission.learner_id)
    )
    period_subq = subq.subquery()
    result = await db.execute(
        select(
            User.username,
            (period_subq.c.completed * 10).label("total_points"),
            Learner.streak_days,
            period_subq.c.completed,
        )
        .join(Learner, Learner.user_id == User.id)
        .join(period_subq, period_subq.c.learner_id == Learner.id)
        .where(*base_filters)
        .order_by(period_subq.c.completed.desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        LeaderboardEntry(
            rank=i + 1,
            username=row.username,
            total_points=row.total_points or 0,
            streak_days=row.streak_days or 0,
            quests_completed=row.completed or 0,
        )
        for i, row in enumerate(rows)
    ]
