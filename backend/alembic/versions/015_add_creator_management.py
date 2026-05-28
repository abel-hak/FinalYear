"""Add creator management support.

Revision ID: 015
Revises: 014
Create Date: 2026-05-28

Adds a creator owner foreign key to learning paths and a creator invitation
table for magic-link assignment and acceptance.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "learning_paths",
        sa.Column("creator_user_id", UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_learning_paths_creator_user_id_users",
        "learning_paths",
        "users",
        ["creator_user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "creator_invitations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("path_id", UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("accepted_by_user_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["path_id"], ["learning_paths.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["accepted_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("path_id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_creator_invitations_email", "creator_invitations", ["email"])
    op.create_index("ix_creator_invitations_token_hash", "creator_invitations", ["token_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_creator_invitations_token_hash", table_name="creator_invitations")
    op.drop_index("ix_creator_invitations_email", table_name="creator_invitations")
    op.drop_table("creator_invitations")
    op.drop_constraint("fk_learning_paths_creator_user_id_users", "learning_paths", type_="foreignkey")
    op.drop_column("learning_paths", "creator_user_id")
