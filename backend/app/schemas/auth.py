"""Pydantic schemas for authentication and email verification payloads."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, UUID4


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)
    role: Literal["learner"] = "learner"


class GoogleSignInRequest(BaseModel):
    credential: str = Field(min_length=1)


class GoogleOAuthExchangeRequest(BaseModel):
    code: str = Field(min_length=1)


class UserLogin(BaseModel):
    username: str
    password: str


class UserPublic(UserBase):
    id: UUID4
    role: str
    creator_path_count: int = 0

    class Config:
        from_attributes = True


class RegistrationResponse(BaseModel):
    verification_required: bool
    message: str
    verification_id: UUID4 | None = None
    expires_at: datetime | None = None
    user: UserPublic | None = None


class VerificationRequest(BaseModel):
    verification_id: UUID4
    otp: str = Field(pattern=r"^\d{6}$", min_length=6, max_length=6)


class VerificationResponse(BaseModel):
    message: str
    user: UserPublic


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetRequestResponse(BaseModel):
    message: str
    reset_id: UUID4
    expires_at: datetime


class PasswordResetVerifyRequest(BaseModel):
    reset_id: UUID4
    otp: str = Field(pattern=r"^\d{6}$", min_length=6, max_length=6)


class PasswordResetVerifyResponse(BaseModel):
    message: str
    reset_id: UUID4
    expires_at: datetime


class PasswordResetConfirmRequest(BaseModel):
    reset_id: UUID4
    password: str = Field(min_length=6, max_length=128)
    confirm_password: str = Field(min_length=6, max_length=128)


class PasswordResetConfirmResponse(BaseModel):
    message: str

