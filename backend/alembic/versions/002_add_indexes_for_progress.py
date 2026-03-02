"""Add indexes for progress and quest lookups

Revision ID: 002
Revises: 001
Create Date: 2026-03-01

Indexes added for:
- submissions(learner_id, created_at): progress timeline per learner
- test_cases(quest_id): load test cases by quest (FK already indexed in PG, explicit for clarity)
"""
from typing import Sequence, Union

from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Progress: list submissions by learner ordered by time
    op.create_index(
        "ix_submissions_learner_id_created_at",
        "submissions",
        ["learner_id", "created_at"],
        unique=False,
    )
    # Load test cases by quest (common in validation flow)
    op.create_index("ix_test_cases_quest_id", "test_cases", ["quest_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_test_cases_quest_id", table_name="test_cases")
    op.drop_index("ix_submissions_learner_id_created_at", table_name="submissions")
