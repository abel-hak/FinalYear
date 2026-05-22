"""Auth service orchestration.

Controllers should delegate auth workflows to this service and map service errors to HTTP responses.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.rate_limit import _login_limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.services.email_service import EmailDeliveryError, SmtpEmailService
from app.models.user import User
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import RegistrationResponse, Token, UserCreate, UserPublic, VerificationResponse


@dataclass
class AuthConflictError(Exception):
    message: str


@dataclass
class AuthRateLimitError(Exception):
    message: str


@dataclass
class AuthInvalidCredentialsError(Exception):
    message: str


@dataclass
class AuthEmailVerificationRequiredError(Exception):
    message: str


@dataclass
class AuthVerificationExpiredError(Exception):
    message: str


@dataclass
class AuthVerificationAttemptsExceededError(Exception):
    message: str


@dataclass
class AuthVerificationCodeInvalidError(Exception):
    message: str


class AuthService:
    """Application service for registration and login."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AuthRepository(db)
        self.email_service = SmtpEmailService()

    async def register_user(self, payload: UserCreate) -> RegistrationResponse:
        settings = get_settings()
        if not settings.email_verification_required:
            existing = await self.repo.find_by_username_or_email(payload.username, payload.email)
            if existing:
                raise AuthConflictError("Username or email already exists")

            user = await self.repo.create_user_with_role_profiles(
                username=payload.username,
                email=payload.email,
                password_hash=hash_password(payload.password),
                role=payload.role,
            )
            await self.db.flush()
            await self.db.refresh(user)
            return RegistrationResponse(
                verification_required=False,
                message="Account created successfully",
                user=UserPublic.model_validate(user),
            )

        existing = await self.repo.find_by_username_or_email(payload.username, payload.email)
        if existing:
            raise AuthConflictError("Username or email already exists")

        pending = await self.repo.find_pending_by_username_or_email(payload.username, payload.email)
        if pending and pending.otp_expires_at > datetime.now(timezone.utc):
            raise AuthConflictError("Username or email already exists")

        if pending:
            await self.repo.delete_pending_registration(pending)
            await self.db.flush()

        otp = f"{secrets.randbelow(1_000_000):06d}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.email_verification_otp_ttl_minutes)
        pending = None
        pending = await self.repo.create_pending_registration(
            username=payload.username,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=payload.role,
            otp_hash=hash_password(otp),
            otp_expires_at=expires_at,
            otp_attempts_remaining=settings.email_verification_max_attempts,
        )
        await self.db.flush()

        try:
            await self.email_service.send_verification_email(
                to_email=payload.email,
                username=payload.username,
                otp=otp,
                expires_minutes=settings.email_verification_otp_ttl_minutes,
            )
        except EmailDeliveryError:
            raise

        return RegistrationResponse(
            verification_required=True,
            message="Verification code sent to your email",
            verification_id=pending.id if pending else None,
            expires_at=expires_at,
        )

    async def verify_registration(self, *, verification_id, otp: str) -> VerificationResponse:
        pending = await self.repo.find_pending_by_id(verification_id)
        if not pending:
            raise AuthVerificationExpiredError("Verification request not found or has expired")

        now = datetime.now(timezone.utc)
        if pending.otp_expires_at <= now:
            await self.repo.delete_pending_registration(pending)
            await self.db.commit()
            raise AuthVerificationExpiredError("Verification code expired. Please register again.")

        if not verify_password(otp, pending.otp_hash):
            pending.otp_attempts_remaining -= 1
            await self.db.flush()
            if pending.otp_attempts_remaining <= 0:
                await self.repo.delete_pending_registration(pending)
                await self.db.commit()
                raise AuthVerificationAttemptsExceededError(
                    "Verification attempts exhausted. Please register again."
                )
            await self.db.commit()
            raise AuthVerificationCodeInvalidError(
                f"Incorrect verification code. {pending.otp_attempts_remaining} attempts remaining."
            )

        existing = await self.repo.find_by_username_or_email(pending.username, pending.email)
        if existing:
            await self.repo.delete_pending_registration(pending)
            await self.db.flush()
            raise AuthConflictError("Username or email already exists")

        user = await self.repo.create_user_with_role_profiles(
            username=pending.username,
            email=pending.email,
            password_hash=pending.password_hash,
            role=pending.role,
        )
        await self.repo.delete_pending_registration(pending)
        await self.db.flush()

        await self.db.refresh(user)
        await self.email_service.send_welcome_email(to_email=user.email, username=user.username)
        return VerificationResponse(message="Email verified successfully", user=UserPublic.model_validate(user))

    async def login(self, *, username: str, password: str, client_ip: str) -> Token:
        if not _login_limiter.is_allowed(f"login:{client_ip}"):
            raise AuthRateLimitError("Too many login attempts. Please try again in a minute.")

        settings = get_settings()
        if settings.email_verification_required:
            pending = await self.repo.find_pending_by_username(username)
            if pending:
                if pending.otp_expires_at <= datetime.now(timezone.utc):
                    await self.repo.delete_pending_registration(pending)
                    await self.db.commit()
                    raise AuthVerificationExpiredError("Verification code expired. Please register again.")
                raise AuthEmailVerificationRequiredError("Please verify your email before signing in")

        user = await self.repo.find_active_by_username(username)
        if not user or not verify_password(password, user.password_hash):
            raise AuthInvalidCredentialsError("Incorrect username or password")

        minutes = getattr(settings, "access_token_expire_minutes", 30)
        access_token = create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(minutes=minutes),
        )
        return Token(access_token=access_token)
