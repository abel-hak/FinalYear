"""Add hint_requests table for AI hint limit tracking

Revision ID: 004
Revises: 003
Create Date: 2026-03-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hint_requests",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("learner_id", UUID(as_uuid=True), sa.ForeignKey("learners.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quest_id", UUID(as_uuid=True), sa.ForeignKey("quests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_hint_requests_learner_quest", "hint_requests", ["learner_id", "quest_id"])


def downgrade() -> None:
    op.drop_index("ix_hint_requests_learner_quest", table_name="hint_requests")
    op.drop_table("hint_requests")
