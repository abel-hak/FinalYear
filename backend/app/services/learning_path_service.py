"""Learning path orchestration service."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.learner_repository import LearnerRepository
from app.repositories.learning_path_repository import LearningPathRepository
from app.schemas.learning_path import (
    CheckpointQuestInfo,
    LearningPathDetail,
    LearningPathQuestItem,
    LearningPathSummary,
)


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

    @staticmethod
    def _path_language(path) -> str:
        return (getattr(path, "language", None) or "python").lower()

    @staticmethod
    def _checkpoint_info(path) -> CheckpointQuestInfo | None:
        checkpoint = getattr(path, "checkpoint_quest", None)
        if not checkpoint:
            return None

        return CheckpointQuestInfo(
            id=str(checkpoint.id),
            title=checkpoint.title,
            description=checkpoint.description,
            level=checkpoint.level,
        )

    @staticmethod
    def _is_unlocked_for_completed_ids(path, completed_ids: set, prev_path) -> bool:
        checkpoint_ok = bool(
            getattr(path, "checkpoint_quest_id", None)
            and path.checkpoint_quest_id in completed_ids
        )
        if prev_path:
            prev_quest_ids = {pq.quest_id for pq in prev_path.path_quests}
            prev_ok = prev_quest_ids.issubset(completed_ids) if prev_quest_ids else True
        else:
            prev_ok = True
        return checkpoint_ok or prev_ok

    async def _has_higher_checkpoint_unlock(
        self, path, all_paths, language: str, level: int, completed_ids: set
    ) -> bool:
        """Check if any higher-level path in same language is checkpoint-unlocked.
        
        Implements cascading unlock: if a higher-level path is unlocked via checkpoint,
        all prerequisite paths become accessible.
        """
        for candidate in all_paths:
            candidate_level = getattr(candidate, "level", 1)
            if self._path_language(candidate) != language:
                continue
            if candidate_level <= level:
                continue
            if not getattr(candidate, "checkpoint_quest_id", None):
                continue
            prev_for_candidate = await self.path_repo.get_first_path_for_language_level(
                self._path_language(candidate),
                candidate_level - 1,
            )
            if self._is_unlocked_for_completed_ids(candidate, completed_ids, prev_for_candidate):
                return True
        return False

    async def list_paths(self, *, current_user) -> list[LearningPathSummary]:
        paths = await self.path_repo.list_paths_with_quests()

        completed_ids: set = set()
        if current_user:
            learner = await self.learner_repo.get_active_by_user_id(current_user.id)
            if learner:
                completed_ids = await self.path_repo.get_completed_quest_ids_for_learner(learner.id)

        # Group by (language, level) so each language progresses independently.
        by_lang_level: dict[tuple[str, int], list] = {}
        for p in paths:
            key = (self._path_language(p), getattr(p, "level", 1))
            by_lang_level.setdefault(key, []).append(p)

        summaries: list[LearningPathSummary] = []
        for p in paths:
            language = self._path_language(p)
            level = getattr(p, "level", 1)
            unlocked = True
            if level > 1 and current_user:
                # First, allow checkpoint-based unlock if configured for this path
                checkpoint_ok = False
                if getattr(p, "checkpoint_quest_id", None):
                    checkpoint_ok = p.checkpoint_quest_id in completed_ids

                prev_paths = by_lang_level.get((language, level - 1), [])
                if prev_paths:
                    prev_quest_ids = self._quest_ids_for_path(prev_paths[0])
                    prev_ok = prev_quest_ids.issubset(completed_ids) if prev_quest_ids else True
                else:
                    prev_ok = True

                # Apply cascading unlock: if a higher-level path is checkpoint-unlocked,
                # all prerequisite paths become accessible.
                higher_unlocked = await self._has_higher_checkpoint_unlock(
                    p, paths, language, level, completed_ids
                )

                unlocked = checkpoint_ok or prev_ok or higher_unlocked

            path_quest_ids = self._quest_ids_for_path(p)
            completed_in_path = len(path_quest_ids.intersection(completed_ids)) if path_quest_ids else 0

            summaries.append(
                LearningPathSummary(
                    id=str(p.id),
                    title=p.title,
                    description=p.description,
                    level=level,
                    order_rank=p.order_rank,
                    language=language,
                    quest_count=len(p.path_quests),
                    completed_count=completed_in_path,
                    unlocked=unlocked,
                    checkpoint_quest_info=self._checkpoint_info(p),
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
        all_paths = await self.path_repo.list_paths_with_quests()

        language = self._path_language(path)
        level = getattr(path, "level", 1)
        is_unlocked = True
        unlock_hint = None
        if level > 1:
            # If a checkpoint quest is configured and the learner has passed it, unlock.
            if getattr(path, "checkpoint_quest_id", None) and path.checkpoint_quest_id in completed_ids:
                is_unlocked = True
            else:
                prev_path = await self.path_repo.get_first_path_for_language_level(language, level - 1)
                if prev_path:
                    prev_quest_ids = self._quest_ids_for_path(prev_path)
                    if prev_quest_ids and not prev_quest_ids.issubset(completed_ids):
                        is_unlocked = False
                        # Build unlock hint with all available options
                        options = []
                        options.append(f"complete all quests in the Level {level - 1} {language.capitalize()} path")
                        
                        if getattr(path, "checkpoint_quest_id", None) and path.checkpoint_quest:
                            options.append(f"solve the checkpoint quest '{path.checkpoint_quest.title}'")
                        
                        hint_text = " or ".join(options)
                        unlock_hint = f"Unlock this path by: {hint_text}."

        # Cascading unlock rule:
        # if any higher-level path in the same language is checkpoint-unlocked,
        # all quests in this prerequisite path become accessible.
        full_access_prereq = await self._has_higher_checkpoint_unlock(
            path, all_paths, language, level, completed_ids
        )
        
        # If cascading unlock is available, the path is unlocked
        if full_access_prereq:
            is_unlocked = True
        
        # If cascading unlock is available and path was locked, add it to the hint
        if full_access_prereq and unlock_hint:
            unlock_hint = unlock_hint.rstrip(".") + " or complete a higher-level checkpoint path."

        quest_items: list[LearningPathQuestItem] = []
        previous_completed = True
        current_assigned = False
        for pq in sorted(path.path_quests, key=lambda x: x.order_rank):
            q = pq.quest
            if not q or q.is_deleted:
                continue
            if q.id in completed_ids:
                status_val = "completed"
            elif full_access_prereq:
                status_val = "current"
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
            language=language,
            quests=quest_items,
            is_unlocked=is_unlocked,
            unlock_hint=unlock_hint,
            checkpoint_quest_info=self._checkpoint_info(path),
        )
