"""
Leaderboard API - top learners by XP.
Supports all-time, weekly, and monthly rankings.
"""
from typing import List, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_learner
from app.models.user import User
from app.services.leaderboard_service import LeaderboardService
from pydantic import BaseModel


router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

Period = Literal["all", "weekly", "monthly", "lifetime"]


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
    period: Period = Query("all", description="all | weekly | monthly | lifetime"),
):
    """
    Top learners by XP. Requires auth (learner or admin).
    period=all or lifetime: lifetime XP; weekly: last 7 days; monthly: last 30 days.
    """
    service = LeaderboardService(db)
    payload = await service.get_leaderboard(user=user, limit=limit, period=period)
    return LeaderboardResponse(**payload)
