"""
Learner progress API.

Returns:
- current_level
- total_points
- quests with status (completed/current/locked)
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.core.security import get_current_learner
from app.models.user import User
from app.models.learner import Learner
from app.models.quest import Quest
from app.models.submission import Submission
from app.schemas.progress import ProgressSummary
from app.schemas.quest import QuestSummary


router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("", response_model=ProgressSummary)
async def get_progress(
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """Return learner's level, points, and quest statuses."""
    # Resolve learner (admins also have a Learner record)
    learner_row = await db.execute(
        select(Learner).where(Learner.user_id == current_user.id, Learner.is_deleted.is_(False))
    )
    learner = learner_row.scalar_one_or_none()
    if not learner:
        # Admin without Learner record (e.g. created before we added dual-role) - create one
        learner = Learner(user_id=current_user.id)
        db.add(learner)
        await db.flush()

    # All quests
    result = await db.execute(
        select(Quest).where(Quest.is_deleted.is_(False)).order_by(Quest.order_rank)
    )
    quests: list[Quest] = list(result.scalars().all())

    # Completed ids
    completed_q = await db.execute(
        select(Submission.quest_id)
        .where(
            Submission.learner_id == learner.id,
            Submission.passed.is_(True),
        )
        .distinct()
    )
    completed_ids = {row[0] for row in completed_q.all()}

    summaries: list[QuestSummary] = []
    previous_completed = True
    current_assigned = False
    for q in quests:
        if q.id in completed_ids:
            status = "completed"
        elif previous_completed and not current_assigned:
            status = "current"
            current_assigned = True
            previous_completed = False
        else:
            status = "locked"
            previous_completed = False

        summaries.append(
            QuestSummary(
                id=q.id,
                title=q.title,
                description=q.description,
                level=q.level,
                order_rank=q.order_rank,
                status=status,
            )
        )

    return ProgressSummary(
        current_level=learner.current_level,
        total_points=learner.total_points,
        streak_days=learner.streak_days,
        quests=summaries,
    )

