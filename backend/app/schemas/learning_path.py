"""
Pydantic schemas for learning paths.
"""
from pydantic import BaseModel


class LearningPathQuestItem(BaseModel):
    """Quest within a path with learner status."""
    id: str
    title: str
    description: str
    level: int
    order_rank: int
    status: str  # completed | current | locked
    tags: list[str] = []


class LearningPathSummary(BaseModel):
    """Path list item."""
    id: str
    title: str
    description: str
    level: int  # 1=Beginner, 2=Intermediate, 3=Advanced
    order_rank: int
    quest_count: int


class LearningPathDetail(BaseModel):
    """Path with ordered quests and learner progress."""
    id: str
    title: str
    description: str
    level: int
    order_rank: int
    quests: list[LearningPathQuestItem]
