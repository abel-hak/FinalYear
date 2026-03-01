"""
SQLAlchemy declarative base and shared model utilities.
All models inherit from this base so Alembic can discover them.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all CodeQuest database models."""
    pass
