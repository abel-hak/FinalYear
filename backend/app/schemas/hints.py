from pydantic import BaseModel, UUID4


class AiHintRequest(BaseModel):
  quest_id: UUID4
  code: str
  last_output: str | None = None


class AiHintResponse(BaseModel):
  hint: str
  remaining: int  # AI hints left for this quest (0 = none left)

