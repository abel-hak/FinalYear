"""
Leaderboard API - top learners by XP.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.security import get_current_learner
from app.models.user import User
from app.models.learner import Learner
from app.models.submission import Submission
from pydantic import BaseModel


router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


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
    limit: int = 10,
):
    """
    Top learners by total_points. Requires auth (learner or admin).
    """
    limit = min(max(limit, 1), 50)
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
        .where(User.role == "learner", User.is_deleted.is_(False), Learner.is_deleted.is_(False))
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
