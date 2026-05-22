"""Auth-related database access helpers."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin import Admin
from app.models.learner import Learner
from app.models.password_reset_request import PasswordResetRequest
from app.models.pending_registration import PendingRegistration
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

    async def find_active_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email, User.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def find_by_username(self, username: str) -> User | None:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def find_by_id(self, user_id: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def find_by_google_sub(self, google_sub: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.google_sub == google_sub, User.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def find_learner_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email, User.role == "learner", User.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def find_pending_by_username(self, username: str) -> PendingRegistration | None:
        result = await self.db.execute(
            select(PendingRegistration).where(PendingRegistration.username == username)
        )
        return result.scalar_one_or_none()

    async def find_pending_by_username_or_email(self, username: str, email: str) -> PendingRegistration | None:
        result = await self.db.execute(
            select(PendingRegistration).where(
                (PendingRegistration.username == username) | (PendingRegistration.email == email)
            )
        )
        return result.scalar_one_or_none()

    async def find_pending_by_id(self, pending_id: str) -> PendingRegistration | None:
        result = await self.db.execute(
            select(PendingRegistration).where(PendingRegistration.id == pending_id)
        )
        return result.scalar_one_or_none()

    async def create_pending_registration(
        self,
        *,
        username: str,
        email: str,
        password_hash: str,
        role: str,
        otp_hash: str,
        otp_expires_at,
        otp_attempts_remaining: int,
    ) -> PendingRegistration:
        pending = PendingRegistration(
            username=username,
            email=email,
            password_hash=password_hash,
            role=role,
            otp_hash=otp_hash,
            otp_expires_at=otp_expires_at,
            otp_attempts_remaining=otp_attempts_remaining,
        )
        self.db.add(pending)
        await self.db.flush()
        return pending

    async def delete_pending_registration(self, pending: PendingRegistration) -> None:
        await self.db.delete(pending)

    async def find_password_reset_by_email(self, email: str) -> PasswordResetRequest | None:
        result = await self.db.execute(
            select(PasswordResetRequest).where(PasswordResetRequest.email == email)
        )
        return result.scalar_one_or_none()

    async def find_password_reset_by_id(self, reset_id: str) -> PasswordResetRequest | None:
        result = await self.db.execute(
            select(PasswordResetRequest).where(PasswordResetRequest.id == reset_id)
        )
        return result.scalar_one_or_none()

    async def create_password_reset_request(
        self,
        *,
        email: str,
        otp_hash: str,
        otp_expires_at,
        otp_attempts_remaining: int,
    ) -> PasswordResetRequest:
        reset_request = PasswordResetRequest(
            email=email,
            otp_hash=otp_hash,
            otp_expires_at=otp_expires_at,
            otp_attempts_remaining=otp_attempts_remaining,
        )
        self.db.add(reset_request)
        await self.db.flush()
        return reset_request

    async def delete_password_reset_request(self, reset_request: PasswordResetRequest) -> None:
        await self.db.delete(reset_request)

    async def create_user_with_role_profiles(
        self,
        *,
        username: str,
        email: str,
        password_hash: str | None,
        role: str,
        google_sub: str | None = None,
    ) -> User:
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            google_sub=google_sub,
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

    async def link_google_subject(self, user: User, google_sub: str) -> User:
        user.google_sub = google_sub
        await self.db.flush()
        return user
