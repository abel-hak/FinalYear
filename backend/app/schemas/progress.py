"""
Schemas for learner progress dashboard.
"""
from typing import List
from pydantic import BaseModel

from app.schemas.quest import QuestSummary


class ProgressSummary(BaseModel):
    current_level: int
    total_points: int
    quests: List[QuestSummary]

