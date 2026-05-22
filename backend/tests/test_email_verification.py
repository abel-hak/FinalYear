import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_register_returns_verification_pending_response(client, monkeypatch) -> None:
    from app.config import get_settings

    monkeypatch.setenv("EMAIL_VERIFICATION_REQUIRED", "true")
    get_settings.cache_clear()

    with patch("app.services.email_service.SmtpEmailService.send_verification_email", new_callable=AsyncMock):
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "verify_me",
                "email": "verify_me@test.dev",
                "password": "test123",
                "role": "learner",
            },
        )

    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["verification_required"] is True
    assert body["verification_id"]
    assert body["expires_at"]


@pytest.mark.asyncio
async def test_login_is_blocked_before_email_verification(client, monkeypatch) -> None:
    from app.config import get_settings

    monkeypatch.setenv("EMAIL_VERIFICATION_REQUIRED", "true")
    get_settings.cache_clear()

    with patch("app.services.email_service.SmtpEmailService.send_verification_email", new_callable=AsyncMock):
        register = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "blocked_verify",
                "email": "blocked_verify@test.dev",
                "password": "test123",
                "role": "learner",
            },
        )

    assert register.status_code == 201, register.text

    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "blocked_verify", "password": "test123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert login.status_code == 403, login.text
    assert "verify your email" in login.json()["detail"].lower()


@pytest.mark.asyncio
async def test_verify_email_creates_user_and_allows_login(client, monkeypatch) -> None:
    from app.config import get_settings

    monkeypatch.setenv("EMAIL_VERIFICATION_REQUIRED", "true")
    get_settings.cache_clear()

    captured = {}

    async def fake_send_verification_email(*args, **kwargs) -> None:
        captured["otp"] = kwargs["otp"]

    with patch("app.services.email_service.SmtpEmailService.send_verification_email", new_callable=AsyncMock) as mock_send, patch(
        "app.services.email_service.SmtpEmailService.send_welcome_email", new_callable=AsyncMock
    ):
        mock_send.side_effect = fake_send_verification_email
        register = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "verify_success",
                "email": "verify_success@test.dev",
                "password": "test123",
                "role": "learner",
            },
        )

        assert register.status_code == 201, register.text
        verification_id = register.json()["verification_id"]
        otp = captured.get("otp")
        assert otp

        verify = await client.post(
            "/api/v1/auth/verify-email",
            json={"verification_id": verification_id, "otp": otp},
        )
        assert verify.status_code == 200, verify.text
        assert verify.json()["user"]["username"] == "verify_success"

        login = await client.post(
            "/api/v1/auth/login",
            data={"username": "verify_success", "password": "test123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert login.status_code == 200, login.text
        assert login.json()["access_token"]