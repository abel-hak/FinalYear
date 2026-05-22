import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_password_reset_request_returns_session_for_registered_learner(client, monkeypatch) -> None:
    from app.config import get_settings

    monkeypatch.setenv("EMAIL_VERIFICATION_REQUIRED", "false")
    get_settings.cache_clear()

    with patch("app.services.email_service.SmtpEmailService.send_password_reset_email", new_callable=AsyncMock) as mock_send:
        resp = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "learner@codequest.dev"},
        )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["message"]
    assert body["reset_id"]
    assert body["expires_at"]
    mock_send.assert_awaited_once()


@pytest.mark.asyncio
async def test_password_reset_request_is_generic_for_unknown_email(client) -> None:
    with patch("app.services.email_service.SmtpEmailService.send_password_reset_email", new_callable=AsyncMock) as mock_send:
        resp = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "missing@example.com"},
        )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["message"]
    assert body["reset_id"]
    assert body["expires_at"]
    mock_send.assert_not_awaited()


@pytest.mark.asyncio
async def test_password_reset_allows_three_attempts_then_expires(client) -> None:
    with patch("app.services.email_service.SmtpEmailService.send_password_reset_email", new_callable=AsyncMock) as mock_send:
        request = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "learner@codequest.dev"},
        )

    reset_id = request.json()["reset_id"]
    otp = mock_send.await_args.kwargs["otp"]

    for _ in range(2):
        invalid = await client.post(
            "/api/v1/auth/password-reset/verify",
            json={"reset_id": reset_id, "otp": "000000"},
        )
        assert invalid.status_code == 400, invalid.text

    final_invalid = await client.post(
        "/api/v1/auth/password-reset/verify",
        json={"reset_id": reset_id, "otp": "000000"},
    )
    assert final_invalid.status_code == 410, final_invalid.text

    expired = await client.post(
        "/api/v1/auth/password-reset/verify",
        json={"reset_id": reset_id, "otp": otp},
    )
    assert expired.status_code == 410, expired.text


@pytest.mark.asyncio
async def test_password_reset_verification_and_confirm_updates_password(client) -> None:
    with patch("app.services.email_service.SmtpEmailService.send_password_reset_email", new_callable=AsyncMock) as mock_send:
        request = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "learner@codequest.dev"},
        )

    reset_id = request.json()["reset_id"]
    otp = mock_send.await_args.kwargs["otp"]

    verify = await client.post(
        "/api/v1/auth/password-reset/verify",
        json={"reset_id": reset_id, "otp": otp},
    )
    assert verify.status_code == 200, verify.text

    confirm = await client.post(
        "/api/v1/auth/password-reset/confirm",
        json={
            "reset_id": reset_id,
            "password": "newpass123",
            "confirm_password": "newpass123",
        },
    )
    assert confirm.status_code == 200, confirm.text

    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "learner1", "password": "newpass123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text

    old_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "learner1", "password": "learner123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert old_login.status_code == 401, old_login.text