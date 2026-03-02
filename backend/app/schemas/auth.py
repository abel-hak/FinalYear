"""
Pydantic schemas for authentication & user-facing auth payloads.
"""
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
    role: Literal["learner", "admin"] = "learner"


class UserLogin(BaseModel):
    username: str
    password: str


class UserPublic(UserBase):
    id: UUID4
    role: str

    class Config:
        from_attributes = True

