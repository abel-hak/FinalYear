"""
Schemas for code execution and quest submission.
"""
from pydantic import BaseModel, UUID4, Field


class CodeRunRequest(BaseModel):
    code: str = Field(..., description="Python code to execute")


class CodeRunResult(BaseModel):
    stdout: str
    stderr: str
    timed_out: bool
    exit_code: int


class SubmissionRequest(BaseModel):
    code: str = Field(..., description="Python code submitted for this quest")


class SubmissionResult(BaseModel):
    quest_id: UUID4
    passed: bool
    tests_passed: int
    tests_total: int
    stdout: str
    stderr: str

