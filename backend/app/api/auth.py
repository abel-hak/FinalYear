"""Auth endpoints: thin controllers that delegate to auth services."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    PasswordResetConfirmRequest,
    PasswordResetConfirmResponse,
    PasswordResetRequest as PasswordResetRequestPayload,
    PasswordResetRequestResponse,
    PasswordResetVerifyRequest,
    PasswordResetVerifyResponse,
    RegistrationResponse,
    Token,
    UserCreate,
    UserPublic,
    VerificationRequest,
    VerificationResponse,
)
from app.core.security import (
    get_current_user,
)
from app.services.email_service import EmailDeliveryError
from app.services.auth_service import (
    AuthConflictError,
    AuthEmailVerificationRequiredError,
    AuthInvalidCredentialsError,
    AuthRateLimitError,
    AuthPasswordResetAttemptsExceededError,
    AuthPasswordResetCodeInvalidError,
    AuthPasswordResetExpiredError,
    AuthPasswordResetInvalidStateError,
    AuthPasswordResetMismatchError,
    AuthService,
    AuthVerificationAttemptsExceededError,
    AuthVerificationCodeInvalidError,
    AuthVerificationExpiredError,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegistrationResponse, status_code=201)
async def register_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new learner or admin account."""
    service = AuthService(db)
    try:
        return await service.register_user(payload)
    except AuthConflictError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    except EmailDeliveryError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=exc.args[0]) from exc


@router.post("/verify-email", response_model=VerificationResponse)
async def verify_email(
    payload: VerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        return await service.verify_registration(verification_id=payload.verification_id, otp=payload.otp)
    except AuthVerificationExpiredError as exc:
        raise HTTPException(status_code=410, detail=exc.message) from exc
    except AuthVerificationAttemptsExceededError as exc:
        raise HTTPException(status_code=410, detail=exc.message) from exc
    except AuthVerificationCodeInvalidError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    except AuthConflictError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc


def _get_client_ip(request: Request) -> str:
    """Get client IP, considering X-Forwarded-For when behind proxy."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth2 password flow login.
    Accepts username + password; returns JWT access token.
    Rate limited: 5 attempts per minute per IP.
    """
    service = AuthService(db)
    try:
        return await service.login(
            username=form_data.username,
            password=form_data.password,
            client_ip=_get_client_ip(request),
        )
    except AuthRateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=exc.message,
        ) from exc
    except AuthEmailVerificationRequiredError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.message) from exc
    except AuthVerificationExpiredError as exc:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=exc.message) from exc
    except AuthInvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


@router.get("/me", response_model=UserPublic)
async def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    """Return the currently authenticated user's public profile."""
    return current_user


@router.post("/password-reset/request", response_model=PasswordResetRequestResponse)
async def request_password_reset(
    payload: PasswordResetRequestPayload,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    return await service.request_password_reset(email=payload.email)


@router.post("/password-reset/verify", response_model=PasswordResetVerifyResponse)
async def verify_password_reset(
    payload: PasswordResetVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        return await service.verify_password_reset(reset_id=payload.reset_id, otp=payload.otp)
    except AuthPasswordResetExpiredError as exc:
        raise HTTPException(status_code=410, detail=exc.message) from exc
    except AuthPasswordResetAttemptsExceededError as exc:
        raise HTTPException(status_code=410, detail=exc.message) from exc
    except AuthPasswordResetCodeInvalidError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc


@router.post("/password-reset/confirm", response_model=PasswordResetConfirmResponse)
async def confirm_password_reset(
    payload: PasswordResetConfirmRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        return await service.confirm_password_reset(payload)
    except AuthPasswordResetExpiredError as exc:
        raise HTTPException(status_code=410, detail=exc.message) from exc
    except AuthPasswordResetInvalidStateError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    except AuthPasswordResetMismatchError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc


