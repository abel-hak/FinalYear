"""SMTP email delivery for auth flows."""

from __future__ import annotations

import asyncio
import smtplib
from email.message import EmailMessage

from app.config import get_settings


class EmailDeliveryError(RuntimeError):
    """Raised when SMTP delivery cannot be completed."""


class SmtpEmailService:
    """Small SMTP-backed email service."""

    def __init__(self) -> None:
        self.settings = get_settings()

    async def send_verification_email(self, *, to_email: str, username: str, otp: str, expires_minutes: int) -> None:
        subject = "Verify your CodeQuest account"
        body = (
            f"Hi {username},\n\n"
            f"Your verification code is {otp}. It expires in {expires_minutes} minutes.\n\n"
            "If you did not request this account, you can ignore this email."
        )
        await asyncio.to_thread(self._send, to_email, subject, body)

    async def send_password_reset_email(self, *, to_email: str, username: str, otp: str, expires_minutes: int) -> None:
        subject = "Reset your CodeQuest password"
        body = (
            f"Hi {username},\n\n"
            f"Your password reset code is {otp}. It expires in {expires_minutes} minutes.\n\n"
            "If you did not request a password reset, you can ignore this email."
        )
        await asyncio.to_thread(self._send, to_email, subject, body)

    async def send_welcome_email(self, *, to_email: str, username: str) -> None:
        subject = "Welcome to CodeQuest"
        body = (
            f"Hi {username},\n\n"
            "Your email has been verified successfully. Welcome to CodeQuest.\n\n"
            "You can now sign in and continue your learning journey."
        )
        await asyncio.to_thread(self._send, to_email, subject, body)

    async def send_creator_invitation_email(
        self,
        *,
        to_email: str,
        username: str | None,
        accept_url: str,
        path_title: str,
        expires_minutes: int,
    ) -> None:
        subject = f"You have been invited to manage {path_title}"
        greeting = f"Hi {username},\n\n" if username else "Hi,\n\n"
        body = (
            greeting
            + f"You have been invited to manage the learning path \"{path_title}\" in CodeQuest.\n\n"
            + f"Accept the invitation here: {accept_url}\n\n"
            + f"This link expires in {expires_minutes} minutes.\n\n"
            + "If you did not expect this invitation, you can ignore this email."
        )
        await asyncio.to_thread(self._send, to_email, subject, body)

    def _send(self, to_email: str, subject: str, body: str) -> None:
        if not self.settings.smtp_host:
            raise EmailDeliveryError("SMTP is not configured")

        message = EmailMessage()
        message["From"] = self.settings.smtp_from_email
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        try:
            with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port, timeout=self.settings.smtp_timeout_seconds) as smtp:
                if self.settings.smtp_use_tls:
                    smtp.starttls()
                if self.settings.smtp_user:
                    smtp.login(self.settings.smtp_user, self.settings.smtp_password or "")
                smtp.send_message(message)
        except Exception as exc:  # pragma: no cover - defensive SMTP wrapper
            raise EmailDeliveryError(str(exc)) from exc
