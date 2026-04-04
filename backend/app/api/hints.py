"""
AI-powered hint endpoint.

Learners can request an AI hint for a specific quest + their current code.
Limited to 3 hints per quest per learner.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_learner
from app.core.ai import generate_hint
from app.models.user import User
from app.schemas.hints import AiHintRequest, AiHintResponse
from app.services.hint_service import (
    HintLearnerRequiredError,
    HintLimitExceededError,
    HintQuestNotFoundError,
    HintRateLimitError,
    HintService,
    HintUnavailableError,
)

HINT_LIMIT_PER_QUEST = 3

router = APIRouter(prefix="/hints", tags=["hints"])


@router.get("/remaining")
async def get_hint_remaining(
    quest_id: str = Query(..., description="Quest UUID"),
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return remaining AI hints for this quest (0–3)."""
    # Preserve current behavior for malformed UUID input.
    try:
        uuid.UUID(quest_id)
    except ValueError:
        return {"remaining": HINT_LIMIT_PER_QUEST}

    service = HintService(db)
    remaining = await service.get_remaining(user_id=current_user.id, quest_id=quest_id)
    return {"remaining": remaining}


@router.post("/ai", response_model=AiHintResponse)
async def get_ai_hint(
    payload: AiHintRequest,
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
) -> AiHintResponse:
    service = HintService(db)
    try:
        return await service.request_hint(
            user_id=current_user.id,
            payload=payload,
            generate_hint_fn=generate_hint,
        )
    except HintRateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=exc.message,
        ) from exc
    except HintLearnerRequiredError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.message) from exc
    except HintQuestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
    except HintLimitExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=exc.message,
        ) from exc
    except HintUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=exc.message,
        ) from exc

