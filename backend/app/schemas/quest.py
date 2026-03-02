"""
Pydantic schemas for quests, test cases, and learner-facing quest views.
"""
from pydantic import BaseModel, UUID4


class QuestBase(BaseModel):
    title: str
    description: str
    level: int
    order_rank: int


class QuestSummary(QuestBase):
    id: UUID4
    status: str  # 'completed' | 'current' | 'locked'

    class Config:
        from_attributes = True


class QuestDetail(QuestBase):
    id: UUID4
    initial_code: str
    explanation_unlocked: bool = False
    explanation: str | None = None

    class Config:
        from_attributes = True

