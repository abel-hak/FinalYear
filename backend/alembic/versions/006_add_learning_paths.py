"""Add learning_paths and learning_path_quests tables

Revision ID: 006
Revises: 005
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "learning_paths",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("order_rank", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_table(
        "learning_path_quests",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("path_id", UUID(as_uuid=True), sa.ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quest_id", UUID(as_uuid=True), sa.ForeignKey("quests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_rank", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("path_id", "quest_id", name="uq_path_quest"),
    )
    op.create_index("ix_learning_path_quests_path_id", "learning_path_quests", ["path_id"])
    op.create_index("ix_learning_path_quests_quest_id", "learning_path_quests", ["quest_id"])


def downgrade() -> None:
    op.drop_index("ix_learning_path_quests_quest_id", table_name="learning_path_quests")
    op.drop_index("ix_learning_path_quests_path_id", table_name="learning_path_quests")
    op.drop_table("learning_path_quests")
    op.drop_table("learning_paths")
