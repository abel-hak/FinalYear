"""Leaderboard orchestration service."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.leaderboard_repository import LeaderboardRepository


class LeaderboardService:
    """Builds leaderboard response models from repository data."""

    def __init__(self, db: AsyncSession) -> None:
        self.repo = LeaderboardRepository(db)

    async def get_leaderboard(self, *, user: User, limit: int, period: str) -> dict[str, Any]:
        if period == "all":
            top_rows, base, completed_col, streak_col, completed_subq = await self.repo.fetch_all_time_rows(limit=limit)
            me_row = await self.repo.fetch_me_all_time(base=base, user_id=user.id)

            entries = [
                {
                    "rank": i + 1,
                    "username": row.username,
                    "total_points": int(row.total_points or 0),
                    "streak_days": int(row.streak_days or 0),
                    "quests_completed": int(row.completed or 0),
                    "is_me": (row.user_id == user.id),
                }
                for i, row in enumerate(top_rows)
            ]

            if not me_row:
                return {"entries": entries, "me": None}

            my_points = int(me_row.total_points or 0)
            my_completed = int(me_row.completed or 0)
            my_streak = int(me_row.streak_days or 0)
            my_username = str(me_row.username)
            ahead_count = await self.repo.count_ahead_all_time(
                completed_col=completed_col,
                streak_col=streak_col,
                completed_subq=completed_subq,
                my_points=my_points,
                my_completed=my_completed,
                my_streak=my_streak,
                my_username=my_username,
            )
            me = {
                "rank": ahead_count + 1,
                "username": my_username,
                "total_points": my_points,
                "streak_days": my_streak,
                "quests_completed": my_completed,
                "is_me": True,
            }
            return {"entries": entries, "me": me}

        top_rows, base = await self.repo.fetch_period_rows(period=period, limit=limit)
        me_row = await self.repo.fetch_me_period(base=base, user_id=user.id)

        entries = [
            {
                "rank": i + 1,
                "username": row.username,
                "total_points": int(row.total_points or 0),
                "streak_days": int(row.streak_days or 0),
                "quests_completed": int(row.completed or 0),
                "is_me": (row.user_id == user.id),
            }
            for i, row in enumerate(top_rows)
        ]

        me = (
            {
                "rank": None,
                "username": me_row.username,
                "total_points": int(me_row.total_points or 0),
                "streak_days": int(me_row.streak_days or 0),
                "quests_completed": int(me_row.completed or 0),
                "is_me": True,
            }
            if me_row
            else {
                "rank": None,
                "username": user.username,
                "total_points": 0,
                "streak_days": 0,
                "quests_completed": 0,
                "is_me": True,
            }
        )
        return {"entries": entries, "me": me}
