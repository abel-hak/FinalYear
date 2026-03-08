"""
Submission / Quest completion - records learner attempts and completion for progress map.
Used to know which quests are completed (unlock next + Knowledge Scroll).
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Submission(Base):
    """
    One submission of code for a quest by a learner.
    passed: True when all test cases pass (quest completed).
    We keep a row per attempt; for "progress" we consider latest passed per (learner, quest).
    """
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    learner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learners.id", ondelete="CASCADE"),
        nullable=False,
    )
    quest_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quests.id", ondelete="CASCADE"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(Text, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    # Optional: store run output or error for debugging/analytics
    output_log: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    learner: Mapped["Learner"] = relationship("Learner", back_populates="submissions")
    quest: Mapped["Quest"] = relationship("Quest", back_populates="submissions")
