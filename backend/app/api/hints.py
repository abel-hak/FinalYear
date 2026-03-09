"""
AI-powered hint endpoint.

Learners can request an AI hint for a specific quest + their current code.
Limited to 3 hints per quest per learner.
"""

import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.security import get_current_learner
from app.core.ai import generate_hint
from app.core.rate_limit import _hint_limiter
from app.models.user import User
from app.models.quest import Quest
from app.models.learner import Learner
from app.models.hint_request import HintRequest
from app.schemas.hints import AiHintRequest, AiHintResponse

HINT_LIMIT_PER_QUEST = 3

router = APIRouter(prefix="/hints", tags=["hints"])


@router.get("/remaining")
async def get_hint_remaining(
    quest_id: str = Query(..., description="Quest UUID"),
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return remaining AI hints for this quest (0–3)."""
    learner_row = await db.execute(
        select(Learner).where(Learner.user_id == current_user.id, Learner.is_deleted.is_(False))
    )
    learner = learner_row.scalar_one_or_none()
    if not learner:
        return {"remaining": HINT_LIMIT_PER_QUEST}

    try:
        qid = uuid.UUID(quest_id)
    except ValueError:
        return {"remaining": HINT_LIMIT_PER_QUEST}
    count_row = await db.execute(
        select(func.count()).select_from(HintRequest).where(
            HintRequest.learner_id == learner.id,
            HintRequest.quest_id == qid,
        )
    )
    used = count_row.scalar() or 0
    remaining = max(0, HINT_LIMIT_PER_QUEST - used)
    return {"remaining": remaining}


@router.post("/ai", response_model=AiHintResponse)
async def get_ai_hint(
    payload: AiHintRequest,
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
) -> AiHintResponse:
    # Rate limit: 10 hint requests per minute per learner
    hint_key = f"hint:{current_user.id}"
    if not _hint_limiter.is_allowed(hint_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many hint requests. Please wait a minute before requesting more hints.",
        )
    # Resolve learner
    learner_row = await db.execute(
        select(Learner).where(Learner.user_id == current_user.id, Learner.is_deleted.is_(False))
    )
    learner = learner_row.scalar_one_or_none()
    if not learner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Learner profile required")

    # Ensure quest exists and is visible
    result = await db.execute(
        select(Quest).where(Quest.id == payload.quest_id, Quest.is_deleted.is_(False))
    )
    quest = result.scalar_one_or_none()
    if not quest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quest not found")

    # Check hint limit
    count_row = await db.execute(
        select(func.count()).select_from(HintRequest).where(
            HintRequest.learner_id == learner.id,
            HintRequest.quest_id == payload.quest_id,
        )
    )
    used = count_row.scalar() or 0
    if used >= HINT_LIMIT_PER_QUEST:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No hints remaining for this quest (limit: {HINT_LIMIT_PER_QUEST})",
        )

    try:
        hint_text = await generate_hint(
            quest_title=quest.title,
            quest_description=quest.description,
            learner_code=payload.code,
            last_output=payload.last_output,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI hints are temporarily unavailable. Please try again in a few moments.",
        ) from exc
    except (httpx.TimeoutException, httpx.RequestError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI hints are temporarily unavailable. Please try again in a few moments.",
        ) from exc

    # Record hint request
    hint_req = HintRequest(learner_id=learner.id, quest_id=payload.quest_id)
    db.add(hint_req)
    await db.commit()

    remaining = max(0, HINT_LIMIT_PER_QUEST - used - 1)
    return AiHintResponse(hint=hint_text, remaining=remaining)

