"""
AI-powered hint endpoint.

Learners can request an AI hint for a specific quest + their current code.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.core.security import get_current_learner
from app.core.ai import generate_hint
from app.models.user import User
from app.models.quest import Quest
from app.schemas.hints import AiHintRequest, AiHintResponse


router = APIRouter(prefix="/hints", tags=["hints"])


@router.post("/ai", response_model=AiHintResponse)
async def get_ai_hint(
    payload: AiHintRequest,
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
) -> AiHintResponse:
    # Ensure quest exists and is visible
    result = await db.execute(
        select(Quest).where(Quest.id == payload.quest_id, Quest.is_deleted.is_(False))
    )
    quest = result.scalar_one_or_none()
    if not quest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quest not found")

    try:
        hint_text = await generate_hint(
            quest_title=quest.title,
            quest_description=quest.description,
            learner_code=payload.code,
            last_output=payload.last_output,
        )
    except RuntimeError as exc:
        # Misconfiguration or upstream error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return AiHintResponse(hint=hint_text)

