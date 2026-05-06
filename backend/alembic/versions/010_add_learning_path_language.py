"""Add language column to learning_paths.

Revision ID: 010
Revises: 009
Create Date: 2026-05-05

Adds a non-nullable `language` column to `learning_paths` so each path scopes
to a single programming language. Existing rows default to "python", so the
3 seeded Python paths keep working unchanged.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "learning_paths",
        sa.Column(
            "language",
            sa.String(length=32),
            nullable=False,
            server_default=sa.text("'python'"),
        ),
    )


def downgrade() -> None:
    op.drop_column("learning_paths", "language")
