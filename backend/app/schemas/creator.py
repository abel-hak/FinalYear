"""Schemas for creator invitation and workspace flows."""

from pydantic import BaseModel


class CreatorInvitationAcceptRequest(BaseModel):
    token: str