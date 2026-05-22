"""
SQLAlchemy models for CodeQuest.
Import Base and all models here so Alembic can discover them in env.py.
"""
from app.db.base import Base
from app.models.user import User
from app.models.pending_registration import PendingRegistration
from app.models.password_reset_request import PasswordResetRequest
from app.models.learner import Learner
from app.models.admin import Admin
from app.models.quest import Quest
from app.models.test_case import TestCase
from app.models.submission import Submission
from app.models.hint_request import HintRequest
from app.models.learning_path import LearningPath, LearningPathQuest

__all__ = [
    "Base",
    "User",
    "PendingRegistration",
    "PasswordResetRequest",
    "Learner",
    "Admin",
    "Quest",
    "TestCase",
    "Submission",
    "HintRequest",
    "LearningPath",
    "LearningPathQuest",
]
