"""Add password reset requests for OTP-based password recovery.

Revision ID: 013
Revises: 012
Create Date: 2026-05-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset_requests",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("otp_hash", sa.String(length=255), nullable=False),
        sa.Column("otp_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("otp_attempts_remaining", sa.Integer(), nullable=False),
        sa.Column("otp_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_password_reset_requests_email", "password_reset_requests", ["email"])


def downgrade() -> None:
    op.drop_index("ix_password_reset_requests_email", table_name="password_reset_requests")
    op.drop_table("password_reset_requests")