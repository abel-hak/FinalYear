"""
SQLAlchemy models for CodeQuest.
Import Base and all models here so Alembic can discover them in env.py.
"""
from app.db.base import Base
from app.models.user import User
from app.models.learner import Learner
from app.models.admin import Admin
from app.models.quest import Quest
from app.models.test_case import TestCase
from app.models.submission import Submission

__all__ = [
    "Base",
    "User",
    "Learner",
    "Admin",
    "Quest",
    "TestCase",
    "Submission",
]
