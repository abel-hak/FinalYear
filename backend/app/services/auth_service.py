"""Auth service orchestration.

Controllers should delegate auth workflows to this service and map service errors to HTTP responses.
"""

from __future__ import annotations

import json
import re
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request as UrlRequest
from urllib.request import urlopen

from jose import JWTError, jwt

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.rate_limit import _login_limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.services.email_service import EmailDeliveryError, SmtpEmailService
from app.models.user import User
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import (
    PasswordResetConfirmRequest,
    PasswordResetConfirmResponse,
    PasswordResetRequest,
    PasswordResetRequestResponse,
    PasswordResetVerifyRequest,
    PasswordResetVerifyResponse,
    RegistrationResponse,
    Token,
    UserCreate,
    UserPublic,
    VerificationResponse,
)


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
class AuthGoogleConfigError(Exception):
    message: str


@dataclass
class AuthGoogleStateError(Exception):
    message: str


@dataclass
class AuthGoogleHandoffError(Exception):
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


@dataclass
class AuthPasswordResetExpiredError(Exception):
    message: str


@dataclass
class AuthPasswordResetAttemptsExceededError(Exception):
    message: str


@dataclass
class AuthPasswordResetCodeInvalidError(Exception):
    message: str


@dataclass
class AuthPasswordResetInvalidStateError(Exception):
    message: str


@dataclass
class AuthPasswordResetMismatchError(Exception):
    message: str


def verify_google_id_token(id_token_value: str) -> dict[str, Any]:
    """Verify a Google ID token and return its claims."""
    settings = get_settings()
    if not settings.google_client_id:
        raise AuthGoogleConfigError("Google sign-in is not configured")

    try:
        token_info_url = "https://oauth2.googleapis.com/tokeninfo?" + urlencode({"id_token": id_token_value})
        with urlopen(token_info_url, timeout=10) as response:
            claims = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise AuthInvalidCredentialsError("Invalid Google credential") from exc

    audience = claims.get("aud")
    if audience != settings.google_client_id:
        raise AuthInvalidCredentialsError("Invalid Google credential")
    return claims


def verify_google_credential(credential: str) -> dict[str, Any]:
    """Backward-compatible alias for existing tests and callers."""
    return verify_google_id_token(credential)


class AuthService:
    """Application service for registration and login."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AuthRepository(db)
        self.email_service = SmtpEmailService()

    def build_google_authorization_url(self, *, state: str) -> str:
        settings = get_settings()
        if not settings.google_client_id or not settings.google_client_secret:
            raise AuthGoogleConfigError("Google sign-in is not configured")

        query = urlencode(
            {
                "client_id": settings.google_client_id,
                "redirect_uri": settings.google_redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "state": state,
                "prompt": "select_account",
                "access_type": "online",
                "include_granted_scopes": "true",
            }
        )
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"

    def create_google_handoff_code(self, user: User) -> str:
        return create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(minutes=5),
            extra_claims={"purpose": "google_oauth_handoff"},
        )

    async def redeem_google_handoff_code(self, handoff_code: str) -> Token:
        settings = get_settings()
        secret = getattr(settings, "jwt_secret_key", None) or "dev-secret-change-me"
        algorithm = getattr(settings, "jwt_algorithm", "HS256")

        try:
            payload = jwt.decode(handoff_code, secret, algorithms=[algorithm])
        except JWTError as exc:
            raise AuthGoogleHandoffError("Google sign-in handoff expired or invalid") from exc

        if payload.get("purpose") != "google_oauth_handoff":
            raise AuthGoogleHandoffError("Google sign-in handoff expired or invalid")

        subject = payload.get("sub")
        if not subject:
            raise AuthGoogleHandoffError("Google sign-in handoff expired or invalid")

        user = await self.repo.find_by_id(subject)
        if user is None:
            raise AuthGoogleHandoffError("Google sign-in handoff expired or invalid")
        return self._mint_access_token_for_user(str(user.id))

    def _mint_access_token_for_user(self, user_id: str) -> Token:
        settings = get_settings()
        minutes = getattr(settings, "access_token_expire_minutes", 30)
        access_token = create_access_token(
            subject=user_id,
            expires_delta=timedelta(minutes=minutes),
        )
        return Token(access_token=access_token)

    async def exchange_google_authorization_code(self, code: str) -> dict[str, Any]:
        settings = get_settings()
        if not settings.google_client_id or not settings.google_client_secret:
            raise AuthGoogleConfigError("Google sign-in is not configured")

        payload = urlencode(
            {
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            }
        ).encode("utf-8")
        request = UrlRequest(
            "https://oauth2.googleapis.com/token",
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )

        try:
            with urlopen(request, timeout=10) as response:
                token_response = json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            raise AuthInvalidCredentialsError("Invalid Google authorization code") from exc

        id_token_value = token_response.get("id_token")
        if not id_token_value:
            raise AuthInvalidCredentialsError("Google authorization did not return an identity token")

        return verify_google_id_token(id_token_value)

    async def resolve_google_identity(self, claims: dict[str, Any]) -> User:
        google_sub = claims.get("sub")
        email = claims.get("email")
        if not google_sub or not email:
            raise AuthInvalidCredentialsError("Google account did not return a valid identity")

        email_verified = claims.get("email_verified")
        if isinstance(email_verified, str):
            email_verified = email_verified.lower() == "true"
        if not email_verified:
            raise AuthInvalidCredentialsError("Google email is not verified")

        user = await self.repo.find_by_google_sub(google_sub)
        if user is None:
            user = await self.repo.find_active_by_email(email)
            if user is not None:
                if user.google_sub and user.google_sub != google_sub:
                    raise AuthConflictError("This account is already linked to another Google identity")
                if not user.google_sub:
                    await self.repo.link_google_subject(user, google_sub)
            else:
                username = await self._unique_google_username(email)
                user = await self.repo.create_user_with_role_profiles(
                    username=username,
                    email=email,
                    password_hash=None,
                    role="learner",
                    google_sub=google_sub,
                )

        if user.google_sub != google_sub:
            await self.repo.link_google_subject(user, google_sub)

        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def handle_google_callback(self, *, code: str) -> str:
        claims = await self.exchange_google_authorization_code(code)
        user = await self.resolve_google_identity(claims)
        return self.create_google_handoff_code(user)

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

    async def google_login(self, *, credential: str, client_ip: str) -> Token:
        if not _login_limiter.is_allowed(f"login:{client_ip}"):
            raise AuthRateLimitError("Too many login attempts. Please try again in a minute.")

        claims = verify_google_credential(credential)
        user = await self.resolve_google_identity(claims)
        return self._mint_access_token_for_user(str(user.id))

    async def request_password_reset(self, *, email: str) -> PasswordResetRequestResponse:
        settings = get_settings()
        existing = await self.repo.find_password_reset_by_email(email)
        if existing:
            await self.repo.delete_password_reset_request(existing)
            await self.db.flush()

        otp = f"{secrets.randbelow(1_000_000):06d}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_otp_ttl_minutes)
        reset_request = await self.repo.create_password_reset_request(
            email=email,
            otp_hash=hash_password(otp),
            otp_expires_at=expires_at,
            otp_attempts_remaining=settings.password_reset_max_attempts,
        )
        await self.db.flush()

        learner = await self.repo.find_learner_by_email(email)
        if learner:
            await self.email_service.send_password_reset_email(
                to_email=email,
                username=learner.username,
                otp=otp,
                expires_minutes=settings.password_reset_otp_ttl_minutes,
            )

        return PasswordResetRequestResponse(
            message="If the email is registered, a reset code has been sent",
            reset_id=reset_request.id,
            expires_at=expires_at,
        )

    async def verify_password_reset(self, *, reset_id, otp: str) -> PasswordResetVerifyResponse:
        reset_request = await self.repo.find_password_reset_by_id(reset_id)
        if not reset_request:
            raise AuthPasswordResetExpiredError("Password reset request not found or has expired")

        now = datetime.now(timezone.utc)
        if reset_request.otp_expires_at <= now:
            await self.repo.delete_password_reset_request(reset_request)
            await self.db.commit()
            raise AuthPasswordResetExpiredError("Password reset code expired. Please request a new one.")

        if not verify_password(otp, reset_request.otp_hash):
            reset_request.otp_attempts_remaining -= 1
            await self.db.flush()
            if reset_request.otp_attempts_remaining <= 0:
                await self.repo.delete_password_reset_request(reset_request)
                await self.db.commit()
                raise AuthPasswordResetAttemptsExceededError(
                    "Password reset attempts exhausted. Please request a new code."
                )
            await self.db.commit()
            raise AuthPasswordResetCodeInvalidError(
                f"Incorrect verification code. {reset_request.otp_attempts_remaining} attempts remaining."
            )

        reset_request.otp_verified_at = now
        await self.db.flush()
        await self.db.commit()
        return PasswordResetVerifyResponse(
            message="Password reset code verified",
            reset_id=reset_request.id,
            expires_at=reset_request.otp_expires_at,
        )

    async def confirm_password_reset(self, payload: PasswordResetConfirmRequest) -> PasswordResetConfirmResponse:
        if payload.password != payload.confirm_password:
            raise AuthPasswordResetMismatchError("Passwords do not match")

        reset_request = await self.repo.find_password_reset_by_id(payload.reset_id)
        if not reset_request:
            raise AuthPasswordResetInvalidStateError("Password reset request not found or has expired")

        now = datetime.now(timezone.utc)
        if reset_request.otp_expires_at <= now:
            await self.repo.delete_password_reset_request(reset_request)
            await self.db.commit()
            raise AuthPasswordResetExpiredError("Password reset code expired. Please request a new one.")

        if reset_request.otp_verified_at is None:
            raise AuthPasswordResetInvalidStateError("Password reset code has not been verified")

        learner = await self.repo.find_learner_by_email(reset_request.email)
        if not learner:
            await self.repo.delete_password_reset_request(reset_request)
            await self.db.commit()
            raise AuthPasswordResetInvalidStateError("Password reset request is no longer valid")

        learner.password_hash = hash_password(payload.password)
        await self.repo.delete_password_reset_request(reset_request)
        await self.db.flush()
        await self.db.commit()
        return PasswordResetConfirmResponse(message="Password updated successfully")

    async def _unique_google_username(self, email: str) -> str:
        local_part = email.split("@", 1)[0].lower()
        base = re.sub(r"[^a-z0-9]+", "_", local_part).strip("_") or "google_user"
        candidate = base
        suffix = 1
        while await self.repo.find_by_username(candidate):
            candidate = f"{base}_{suffix}"
            suffix += 1
        return candidate
