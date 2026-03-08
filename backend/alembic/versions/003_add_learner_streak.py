"""Add streak tracking to learners

Revision ID: 003
Revises: 002
Create Date: 2026-03-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("learners", sa.Column("streak_days", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("learners", sa.Column("last_activity_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("learners", "last_activity_date")
    op.drop_column("learners", "streak_days")
