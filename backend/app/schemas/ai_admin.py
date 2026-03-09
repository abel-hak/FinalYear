from pydantic import BaseModel, Field


class AdminQuestAIDraftRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=80)
    difficulty: int = Field(1, ge=1, le=3, description="1=beginner, 2=intermediate, 3=advanced")
    bug_type: str = Field(..., min_length=2, max_length=80, description="e.g. off-by-one, wrong key, bad condition")
    extra_instructions: str | None = Field(None, max_length=500)


class AdminQuestAIDraftResponse(BaseModel):
    title: str
    description: str
    level: int
    initial_code: str
    solution_code: str
    explanation: str
    expected_output: str
    tags: list[str] = []

