"""Learning path orchestration service."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.learner_repository import LearnerRepository
from app.repositories.learning_path_repository import LearningPathRepository
from app.schemas.learning_path import LearningPathDetail, LearningPathQuestItem, LearningPathSummary


@dataclass
class LearningPathNotFoundError(Exception):
    message: str


class LearningPathService:
    """Builds learner-facing learning path responses."""

    def __init__(self, db: AsyncSession) -> None:
        self.path_repo = LearningPathRepository(db)
        self.learner_repo = LearnerRepository(db)

    @staticmethod
    def _quest_ids_for_path(path) -> set:
        return {pq.quest_id for pq in path.path_quests}

    async def list_paths(self, *, current_user) -> list[LearningPathSummary]:
        paths = await self.path_repo.list_paths_with_quests()

        completed_ids: set = set()
        if current_user:
            learner = await self.learner_repo.get_active_by_user_id(current_user.id)
            if learner:
                completed_ids = await self.path_repo.get_completed_quest_ids_for_learner(learner.id)

        by_level: dict[int, list] = {}
        for p in paths:
            by_level.setdefault(getattr(p, "level", 1), []).append(p)

        summaries: list[LearningPathSummary] = []
        for p in paths:
            level = getattr(p, "level", 1)
            unlocked = True
            if level > 1 and current_user:
                prev_paths = by_level.get(level - 1, [])
                if prev_paths:
                    prev_quest_ids = self._quest_ids_for_path(prev_paths[0])
                    unlocked = prev_quest_ids.issubset(completed_ids) if prev_quest_ids else True

            path_quest_ids = self._quest_ids_for_path(p)
            completed_in_path = len(path_quest_ids.intersection(completed_ids)) if path_quest_ids else 0

            summaries.append(
                LearningPathSummary(
                    id=str(p.id),
                    title=p.title,
                    description=p.description,
                    level=level,
                    order_rank=p.order_rank,
                    quest_count=len(p.path_quests),
                    completed_count=completed_in_path,
                    unlocked=unlocked,
                )
            )
        return summaries

    async def get_path_detail(self, *, path_id: str, user_id) -> LearningPathDetail:
        try:
            pid = UUID(path_id)
        except ValueError as exc:
            raise LearningPathNotFoundError("Path not found") from exc

        path = await self.path_repo.get_path_with_quests(pid)
        if not path:
            raise LearningPathNotFoundError("Path not found")

        learner = await self.learner_repo.get_or_create_active_by_user_id(user_id)
        completed_ids = await self.path_repo.get_completed_quest_ids_for_learner(learner.id)

        level = getattr(path, "level", 1)
        is_unlocked = True
        unlock_hint = None
        if level > 1:
            prev_path = await self.path_repo.get_first_path_for_level(level - 1)
            if prev_path:
                prev_quest_ids = self._quest_ids_for_path(prev_path)
                if prev_quest_ids and not prev_quest_ids.issubset(completed_ids):
                    is_unlocked = False
                    unlock_hint = f"Complete all quests in Level {level - 1} to unlock this path."

        quest_items: list[LearningPathQuestItem] = []
        previous_completed = True
        current_assigned = False
        for pq in sorted(path.path_quests, key=lambda x: x.order_rank):
            q = pq.quest
            if not q or q.is_deleted:
                continue
            if q.id in completed_ids:
                status_val = "completed"
            elif previous_completed and not current_assigned:
                status_val = "current"
                current_assigned = True
                previous_completed = False
            else:
                status_val = "locked"
                previous_completed = False

            quest_items.append(
                LearningPathQuestItem(
                    id=str(q.id),
                    title=q.title,
                    description=q.description,
                    level=q.level,
                    order_rank=pq.order_rank,
                    status=status_val,
                    tags=q.tags if q.tags else [],
                )
            )

        return LearningPathDetail(
            id=str(path.id),
            title=path.title,
            description=path.description,
            level=level,
            order_rank=path.order_rank,
            quests=quest_items,
            is_unlocked=is_unlocked,
            unlock_hint=unlock_hint,
        )
