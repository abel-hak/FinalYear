from pydantic import BaseModel


class AchievementProgress(BaseModel):
    current: int
    max: int


class AchievementOut(BaseModel):
    id: str
    title: str
    description: str
    icon_key: str
    xp: int
    rarity: str  # common | rare | epic | legendary
    unlocked: bool
    progress: AchievementProgress | None = None

