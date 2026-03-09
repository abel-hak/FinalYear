from pydantic import BaseModel, UUID4


class AiHintRequest(BaseModel):
    quest_id: UUID4
    code: str
    last_output: str | None = None


class AiHintResponse(BaseModel):
    hint: str
    remaining: int  # AI hints left for this quest (0 = none left)
    hint_number: int  # 1..HINT_LIMIT_PER_QUEST
    limit: int  # total hints allowed per quest

