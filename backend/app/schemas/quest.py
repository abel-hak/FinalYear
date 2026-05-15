"""
Pydantic schemas for quests, test cases, and learner-facing quest views.
"""
from pydantic import BaseModel, UUID4


class QuestBase(BaseModel):
    title: str
    description: str
    level: int
    xp_reward: int = 10
    language: str = "python"
    order_rank: int


class QuestSummary(QuestBase):
    id: UUID4
    status: str  # 'completed' | 'current' | 'locked'
    tags: list[str] = []

    class Config:
        from_attributes = True


class QuestDetail(QuestBase):
    id: UUID4
    initial_code: str
    explanation_unlocked: bool = False
    explanation: str | None = None
    tags: list[str] = []
    prev_id: UUID4 | None = None  # Previous quest in order, if any
    next_id: UUID4 | None = None  # Next quest in order, if any
    failed_attempts_count: int = 0  # Number of failed submissions for this learner on this quest
    xp_penalty_preview: int = 0  # XP penalty that will be applied on next pass (only if quest not yet passed)

    class Config:
        from_attributes = True

