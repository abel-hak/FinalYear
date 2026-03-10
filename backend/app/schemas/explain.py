from pydantic import BaseModel, UUID4


class ExplainFailureRequest(BaseModel):
    quest_id: UUID4
    code: str
    expected_output: str | None = None
    actual_output: str | None = None
    stderr: str | None = None


class ExplainFailureResponse(BaseModel):
    what_it_does: str
    why_wrong: str
    next_action: str

