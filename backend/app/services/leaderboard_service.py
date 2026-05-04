"""Leaderboard orchestration service."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.leaderboard_repository import LeaderboardRepository
from app.services.points_service import PointsService


class LeaderboardService:
    """Builds leaderboard response models from repository data."""

    def __init__(self, db: AsyncSession) -> None:
        self.repo = LeaderboardRepository(db)
        self.points_service = PointsService(db)

    @staticmethod
    def _rank_key(row: Any) -> tuple[int, int, int, str]:
        return (
            -int(row.total_points or 0),
            -int(row.completed or 0),
            -int(row.streak_days or 0),
            str(row.username),
        )

    async def _build_lifetime_rows(self, rows: list[Any], user_id) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        for row in rows:
            points = await self.points_service.get_lifetime_points_for_user(row.user_id)
            out.append(
                {
                    "user_id": row.user_id,
                    "username": row.username,
                    "total_points": points,
                    "streak_days": int(row.streak_days or 0),
                    "quests_completed": int(row.completed or 0),
                    "is_me": (row.user_id == user_id),
                }
            )
        out.sort(key=lambda item: (-item["total_points"], -item["quests_completed"], -item["streak_days"], item["username"]))
        for index, item in enumerate(out, start=1):
            item["rank"] = index
        return out

    @staticmethod
    def _build_rows(rows: list[Any], user_id) -> list[dict[str, Any]]:
        out = [
            {
                "user_id": row.user_id,
                "username": row.username,
                "total_points": int(row.total_points or 0),
                "streak_days": int(row.streak_days or 0),
                "quests_completed": int(row.completed or 0),
                "is_me": (row.user_id == user_id),
            }
            for row in rows
        ]
        out.sort(key=lambda item: (-item["total_points"], -item["quests_completed"], -item["streak_days"], item["username"]))
        for index, item in enumerate(out, start=1):
            item["rank"] = index
        return out

    async def get_leaderboard(self, *, user: User, limit: int, period: str) -> dict[str, Any]:
        if period in {"all", "lifetime"}:
            rows = await self.repo.fetch_all_time_rows()
            ranked = await self._build_lifetime_rows(rows, user.id)
        else:
            rows = await self.repo.fetch_period_rows(period=period)
            ranked = self._build_rows(rows, user.id)

        entries = [
            {
                "rank": row["rank"],
                "username": row["username"],
                "total_points": row["total_points"],
                "streak_days": row["streak_days"],
                "quests_completed": row["quests_completed"],
                "is_me": row["is_me"],
            }
            for row in ranked[:limit]
        ]
        me = next((row for row in ranked if row["user_id"] == user.id), None)
        if not me:
            me = {
                "rank": None,
                "username": user.username,
                "total_points": 0,
                "streak_days": 0,
                "quests_completed": 0,
                "is_me": True,
            }
        else:
            me = {
                "rank": me["rank"],
                "username": me["username"],
                "total_points": me["total_points"],
                "streak_days": me["streak_days"],
                "quests_completed": me["quests_completed"],
                "is_me": True,
            }
        return {"entries": entries, "me": me}
