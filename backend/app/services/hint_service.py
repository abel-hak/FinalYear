"""Hint service orchestration for hint limits and AI hint generation."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Awaitable, Callable

import httpx
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import _hint_limiter
from app.repositories.hint_repository import HintRepository
from app.repositories.learner_repository import LearnerRepository
from app.repositories.quest_repository import QuestRepository
from app.schemas.hints import AiHintRequest, AiHintResponse

HINT_LIMIT_PER_QUEST = 3


@dataclass
class HintRateLimitError(Exception):
    message: str


@dataclass
class HintLearnerRequiredError(Exception):
    message: str


@dataclass
class HintQuestNotFoundError(Exception):
    message: str


@dataclass
class HintLimitExceededError(Exception):
    message: str


@dataclass
class HintUnavailableError(Exception):
    message: str


class HintService:
    """Application service for hint quota checks and AI hint generation."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.learner_repo = LearnerRepository(db)
        self.quest_repo = QuestRepository(db)
        self.hint_repo = HintRepository(db)

    async def get_remaining(self, *, user_id, quest_id: str) -> int:
        learner = await self.learner_repo.get_active_by_user_id(user_id)
        if not learner:
            return HINT_LIMIT_PER_QUEST

        try:
            parsed_quest_id = uuid.UUID(quest_id)
        except ValueError:
            return HINT_LIMIT_PER_QUEST

        used = await self.hint_repo.count_for_learner_quest(learner.id, parsed_quest_id)
        return max(0, HINT_LIMIT_PER_QUEST - used)

    async def request_hint(
        self,
        *,
        user_id,
        payload: AiHintRequest,
        generate_hint_fn: Callable[..., Awaitable[str]],
    ) -> AiHintResponse:
        hint_key = f"hint:{user_id}"
        if not _hint_limiter.is_allowed(hint_key):
            raise HintRateLimitError(
                "Too many hint requests. Please wait a minute before requesting more hints."
            )

        learner = await self.learner_repo.get_active_by_user_id(user_id)
        if not learner:
            raise HintLearnerRequiredError("Learner profile required")

        quest = await self.quest_repo.get_active_by_id(payload.quest_id)
        if not quest:
            raise HintQuestNotFoundError("Quest not found")

        used = await self.hint_repo.count_for_learner_quest(learner.id, payload.quest_id)
        if used >= HINT_LIMIT_PER_QUEST:
            raise HintLimitExceededError(
                f"No hints remaining for this quest (limit: {HINT_LIMIT_PER_QUEST})"
            )

        hint_number = used + 1
        try:
            hint_text = await generate_hint_fn(
                quest_title=quest.title,
                quest_description=quest.description,
                learner_code=payload.code,
                last_output=payload.last_output,
                hint_number=hint_number,
            )
        except RuntimeError as exc:
            raise HintUnavailableError(str(exc)) from exc
        except httpx.HTTPStatusError as exc:
            raise HintUnavailableError(
                "AI hints are temporarily unavailable. Please try again in a few moments."
            ) from exc
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            raise HintUnavailableError(
                "AI hints are temporarily unavailable. Please try again in a few moments."
            ) from exc

        await self.hint_repo.add_request(learner.id, payload.quest_id)
        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            raise HintUnavailableError("AI hints are temporarily unavailable. Please try again in a few moments.") from exc

        remaining = max(0, HINT_LIMIT_PER_QUEST - used - 1)
        return AiHintResponse(
            hint=hint_text,
            remaining=remaining,
            hint_number=hint_number,
            limit=HINT_LIMIT_PER_QUEST,
        )
