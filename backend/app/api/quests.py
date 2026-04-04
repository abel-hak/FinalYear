"""Learner quest APIs."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_learner
from app.models.user import User
from app.schemas.quest import QuestSummary, QuestDetail
from app.schemas.execute import SubmissionRequest, SubmissionResult
from app.core.sandbox import run_python
from app.services.learner_progress_service import (
    LearnerProgressService,
    QuestLockedError,
    QuestNotFoundError,
)
from app.services.quest_submission_service import (
    QuestSubmissionService,
    SubmissionQuestNotFoundError,
    SubmissionRateLimitError,
    SubmissionSystemBusyError,
)
from pydantic import UUID4


router = APIRouter(prefix="/quests", tags=["quests"])


@router.get("", response_model=List[QuestSummary])
async def list_quests(
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """
    List all quests in linear order with learner-specific status:
    - 'completed': learner has at least one passed submission
    - 'current': first quest not yet completed but previous is completed (or first quest)
    - 'locked': all others
    """
    service = LearnerProgressService(db)
    return await service.list_quests_for_user(current_user.id)


@router.get("/{quest_id}", response_model=QuestDetail)
async def get_quest(
    quest_id: UUID4,
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """
    Get quest detail for a learner.
    - Always returns description and initial_code.
    - explanation is only included if learner has completed the quest.
    """
    service = LearnerProgressService(db)
    try:
        return await service.get_quest_detail_for_user(current_user.id, quest_id)
    except QuestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
    except QuestLockedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.message) from exc


@router.post("/{quest_id}/submit", response_model=SubmissionResult)
async def submit_quest(
    quest_id: UUID4,
    payload: SubmissionRequest,
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """Submit learner code for a quest and return test outcome details."""
    service = QuestSubmissionService(db)
    try:
        return await service.submit(
            user_id=current_user.id,
            quest_id=quest_id,
            payload=payload,
            run_code=run_python,
        )
    except SubmissionQuestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
    except SubmissionRateLimitError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=exc.message) from exc
    except SubmissionSystemBusyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=exc.message,
        ) from exc

