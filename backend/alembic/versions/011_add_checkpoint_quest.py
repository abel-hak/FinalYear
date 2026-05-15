"""Add checkpoint_quest_id to learning_paths

Revision ID: 011
Revises: 010
Create Date: 2026-05-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "learning_paths",
        sa.Column(
            "checkpoint_quest_id",
            UUID(as_uuid=True),
            sa.ForeignKey("quests.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_learning_paths_checkpoint_quest_id", "learning_paths", ["checkpoint_quest_id"])


def downgrade() -> None:
    op.drop_index("ix_learning_paths_checkpoint_quest_id", table_name="learning_paths")
    op.drop_column("learning_paths", "checkpoint_quest_id")
