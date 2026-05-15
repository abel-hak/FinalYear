"""
Learning path model - curated sequences of quests for specific goals (e.g. Python basics).
"""
import uuid
from sqlalchemy import String, Integer, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LearningPath(Base):
    """A curated sequence of quests for a learning goal."""
    __tablename__ = "learning_paths"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)  # 1=Beginner, 2=Intermediate, 3=Advanced
    order_rank: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Programming language this path teaches; lets quests/paths progress
    # independently per language (e.g. Java level 2 unlocks when Java level 1
    # is done, regardless of Python progress).
    language: Mapped[str] = mapped_column(String(32), default="python", nullable=False)

    # Optional checkpoint quest which, if completed by a learner, unlocks this path
    checkpoint_quest_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quests.id", ondelete="SET NULL"),
        nullable=True,
    )

    checkpoint_quest: Mapped["Quest | None"] = relationship(
        "Quest",
        foreign_keys=[checkpoint_quest_id],
        lazy="joined",
    )

    path_quests: Mapped[list["LearningPathQuest"]] = relationship(
        "LearningPathQuest",
        back_populates="learning_path",
        order_by="LearningPathQuest.order_rank",
        cascade="all, delete-orphan",
    )


class LearningPathQuest(Base):
    """Junction: quests in a learning path with order."""
    __tablename__ = "learning_path_quests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    path_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
    )
    quest_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quests.id", ondelete="CASCADE"),
        nullable=False,
    )
    order_rank: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    __table_args__ = (UniqueConstraint("path_id", "quest_id", name="uq_path_quest"),)

    learning_path: Mapped["LearningPath"] = relationship(
        "LearningPath",
        back_populates="path_quests",
    )
    quest: Mapped["Quest"] = relationship("Quest", back_populates="learning_path_quests")

