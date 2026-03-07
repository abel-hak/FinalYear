"""
Schemas for admin quest & test case management.
"""
from typing import Optional, List
from pydantic import BaseModel, UUID4
from datetime import datetime


class AdminStats(BaseModel):
    total_users: int
    quests_completed: int
    total_quests: int
    completion_rate_pct: float


class AdminUserProgress(BaseModel):
    id: str
    username: str
    email: str
    quests_completed: int
    total_quests: int
    xp_earned: int
    last_active: Optional[datetime] = None


class AdminQuestCompletion(BaseModel):
    quest_id: str
    quest_title: str
    completed: int
    failed: int


class AdminDifficultyDistribution(BaseModel):
    level: int
    label: str
    count: int


class AdminDailyActivity(BaseModel):
    day: str
    date: str
    submissions: int
    unique_users: int


class AdminAnalytics(BaseModel):
    quest_completion: List[AdminQuestCompletion]
    difficulty_distribution: List[AdminDifficultyDistribution]
    weekly_activity: List[AdminDailyActivity]


class QuestAdminBase(BaseModel):
    title: str
    description: str
    level: int
    order_rank: int
    initial_code: str
    solution_code: str
    explanation: str


class QuestCreate(QuestAdminBase):
    pass


class QuestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[int] = None
    order_rank: Optional[int] = None
    initial_code: Optional[str] = None
    solution_code: Optional[str] = None
    explanation: Optional[str] = None


class QuestAdmin(QuestAdminBase):
    id: UUID4
    is_deleted: bool

    class Config:
        from_attributes = True


class TestCaseCreate(BaseModel):
    input_data: dict | None = None
    expected_output: str
    is_hidden: bool = False


class TestCaseAdmin(BaseModel):
    id: UUID4
    quest_id: UUID4
    input_data: dict | None
    expected_output: str
    is_hidden: bool

    class Config:
        from_attributes = True

