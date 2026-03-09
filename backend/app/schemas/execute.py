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


class TestCaseResult(BaseModel):
    test_case_id: UUID4
    passed: bool
    expected_output: str | None = None  # None for hidden test cases
    is_hidden: bool = False


class SubmissionResult(BaseModel):
    quest_id: UUID4
    passed: bool
    tests_passed: int
    tests_total: int
    stdout: str
    stderr: str
    actual_output: str
    test_results: list[TestCaseResult] = []

