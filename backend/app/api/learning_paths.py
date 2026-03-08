"""
Learning paths API - curated sequences of quests for specific goals.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.core.security import get_current_learner, get_current_learner_optional
from app.models.user import User
from app.models.learner import Learner
from app.models.quest import Quest
from app.models.learning_path import LearningPath, LearningPathQuest
from app.models.submission import Submission
from app.schemas.learning_path import (
    LearningPathSummary,
    LearningPathDetail,
    LearningPathQuestItem,
)

router = APIRouter(prefix="/learning-paths", tags=["learning-paths"])


async def _get_learner_or_none(db: AsyncSession, user_id):
    """Resolve learner; returns None if admin without learner record."""
    result = await db.execute(
        select(Learner).where(
            Learner.user_id == user_id,
            Learner.is_deleted.is_(False),
        )
    )
    return result.scalar_one_or_none()


def _quest_ids_for_path(path) -> set:
    """Quest IDs in a path (for unlock check)."""
    return {pq.quest_id for pq in path.path_quests}


@router.get("", response_model=List[LearningPathSummary])
async def list_learning_paths(
    current_user: User | None = Depends(get_current_learner_optional),
    db: AsyncSession = Depends(get_db),
):
    """List learning paths. When authenticated, returns unlocked status (Level N unlocks when N-1 complete)."""
    result = await db.execute(
        select(LearningPath)
        .options(selectinload(LearningPath.path_quests))
        .order_by(LearningPath.level, LearningPath.order_rank)
    )
    paths = list(result.scalars().all())

    completed_ids: set = set()
    if current_user:
        learner = await _get_learner_or_none(db, current_user.id)
        if learner:
            completed_q = await db.execute(
                select(Submission.quest_id)
                .where(
                    Submission.learner_id == learner.id,
                    Submission.passed.is_(True),
                )
                .distinct()
            )
            completed_ids = {row[0] for row in completed_q.all()}

    by_level: dict[int, list] = {}
    for p in paths:
        lv = getattr(p, "level", 1)
        by_level.setdefault(lv, []).append(p)

    summaries = []
    for p in paths:
        level = getattr(p, "level", 1)
        unlocked = True
        if level > 1 and current_user:
            prev_paths = by_level.get(level - 1, [])
            if prev_paths:
                prev_quest_ids = _quest_ids_for_path(prev_paths[0])
                unlocked = prev_quest_ids.issubset(completed_ids) if prev_quest_ids else True

        summaries.append(
            LearningPathSummary(
                id=str(p.id),
                title=p.title,
                description=p.description,
                level=level,
                order_rank=p.order_rank,
                quest_count=len(p.path_quests),
                unlocked=unlocked,
            )
        )
    return summaries


@router.get("/{path_id}", response_model=LearningPathDetail)
async def get_learning_path(
    path_id: str,
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """Get path with quests; quest status reflects learner progress."""
    from uuid import UUID
    try:
        pid = UUID(path_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Path not found")

    result = await db.execute(
        select(LearningPath)
        .options(
            selectinload(LearningPath.path_quests).selectinload(LearningPathQuest.quest),
        )
        .where(LearningPath.id == pid)
    )
    path = result.scalar_one_or_none()
    if not path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Path not found")

    learner = await _get_learner_or_none(db, current_user.id)
    if not learner:
        learner = Learner(user_id=current_user.id)
        db.add(learner)
        await db.flush()

    completed_q = await db.execute(
        select(Submission.quest_id)
        .where(
            Submission.learner_id == learner.id,
            Submission.passed.is_(True),
        )
        .distinct()
    )
    completed_ids = {row[0] for row in completed_q.all()}

    # Check if path is unlocked (Level N requires Level N-1 path complete)
    level = getattr(path, "level", 1)
    is_unlocked = True
    unlock_hint = None
    if level > 1:
        prev_result = await db.execute(
            select(LearningPath)
            .options(selectinload(LearningPath.path_quests))
            .where(LearningPath.level == level - 1)
            .order_by(LearningPath.order_rank)
            .limit(1)
        )
        prev_path = prev_result.scalar_one_or_none()
        if prev_path:
            prev_quest_ids = _quest_ids_for_path(prev_path)
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
        level=getattr(path, "level", 1),
        order_rank=path.order_rank,
        quests=quest_items,
        is_unlocked=is_unlocked,
        unlock_hint=unlock_hint,
    )
