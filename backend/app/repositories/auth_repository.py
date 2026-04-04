"""Auth-related database access helpers."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin import Admin
from app.models.learner import Learner
from app.models.user import User


class AuthRepository:
    """Encapsulates auth-related SQLAlchemy operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def find_by_username_or_email(self, username: str, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where((User.username == username) | (User.email == email))
        )
        return result.scalar_one_or_none()

    async def find_active_by_username(self, username: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.username == username, User.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def create_user_with_role_profiles(
        self,
        *,
        username: str,
        email: str,
        password_hash: str,
        role: str,
    ) -> User:
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            role=role,
        )
        self.db.add(user)
        await self.db.flush()

        if role == "learner":
            self.db.add(Learner(user_id=user.id))
        else:
            self.db.add(Admin(user_id=user.id, admin_status="active"))
            self.db.add(Learner(user_id=user.id))

        return user
