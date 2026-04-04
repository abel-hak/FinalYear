"""AI explain-failure service orchestration."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Awaitable, Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.quest_repository import QuestRepository
from app.schemas.explain import ExplainFailureRequest, ExplainFailureResponse


@dataclass
class ExplainQuestNotFoundError(Exception):
    message: str


@dataclass
class ExplainUnavailableError(Exception):
    message: str


class ExplainService:
    """Application service for failed-submission explanation workflow."""

    def __init__(self, db: AsyncSession) -> None:
        self.quest_repo = QuestRepository(db)

    async def explain_failure(
        self,
        *,
        payload: ExplainFailureRequest,
        explain_fn: Callable[..., Awaitable[dict]],
    ) -> ExplainFailureResponse:
        quest = await self.quest_repo.get_active_by_id(payload.quest_id)
        if not quest:
            raise ExplainQuestNotFoundError("Quest not found")

        try:
            data = await explain_fn(
                quest_title=quest.title,
                quest_description=quest.description,
                learner_code=payload.code,
                expected_output=payload.expected_output,
                actual_output=payload.actual_output,
                stderr=payload.stderr,
            )
        except RuntimeError as exc:
            raise ExplainUnavailableError(str(exc)) from exc

        return ExplainFailureResponse(
            what_it_does=str(data.get("what_it_does", "")).strip() or "Explanation not available.",
            why_wrong=str(data.get("why_wrong", "")).strip() or "Explanation not available.",
            next_action=str(data.get("next_action", "")).strip()
            or "Try checking the lines around the reported mismatch.",
        )
