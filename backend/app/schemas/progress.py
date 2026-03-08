"""
Schemas for learner progress dashboard.
"""
from typing import List
from pydantic import BaseModel

from app.schemas.quest import QuestSummary


class ReviewSuggestion(BaseModel):
    """Quest suggested for spaced repetition review (completed X+ days ago)."""
    id: str
    title: str
    description: str
    level: int
    order_rank: int
    tags: list[str] = []
    last_completed_at: str  # ISO datetime when learner last passed
    days_since_completion: int  # How many days ago


class ProgressSummary(BaseModel):
    current_level: int
    total_points: int
    streak_days: int = 0
    last_activity_date: str | None = None  # YYYY-MM-DD, for daily notification (US-013)
    quests: List[QuestSummary]

