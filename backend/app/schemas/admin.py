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
    xp_reward: int = 10
    order_rank: int
    initial_code: str
    solution_code: str
    explanation: str
    tags: List[str] = []


class QuestCreate(QuestAdminBase):
    pass


class QuestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[int] = None
    xp_reward: Optional[int] = None
    order_rank: Optional[int] = None
    initial_code: Optional[str] = None
    solution_code: Optional[str] = None
    explanation: Optional[str] = None
    tags: Optional[List[str]] = None


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


# --- Content quality checks ---
class QuestQualityIssue(BaseModel):
    quest_id: UUID4
    order_rank: int
    title: str
    issues: List[str]


class QuestQualityReport(BaseModel):
    total_quests: int
    quests_with_issues: int
    items: List[QuestQualityIssue]


# Learning path admin schemas
class LearningPathCreate(BaseModel):
    title: str
    description: str
    level: int = 1
    order_rank: int = 0


class LearningPathUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[int] = None
    order_rank: Optional[int] = None


class LearningPathQuestAdmin(BaseModel):
    id: UUID4
    quest_id: UUID4
    order_rank: int
    quest_title: str
    quest_level: int

    class Config:
        from_attributes = True


class LearningPathAdmin(BaseModel):
    id: UUID4
    title: str
    description: str
    level: int
    order_rank: int
    quest_count: int = 0

    class Config:
        from_attributes = True


class LearningPathAddQuest(BaseModel):
    quest_id: UUID4
    order_rank: Optional[int] = None  # append at end if not set

