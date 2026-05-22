"""Password reset records for OTP-based password recovery."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PasswordResetRequest(Base):
    """Short-lived password reset record guarded by a 6-digit OTP."""

    __tablename__ = "password_reset_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    otp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    otp_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    otp_attempts_remaining: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    otp_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )