import pytest
from httpx import AsyncClient
from urllib.parse import parse_qs, urlparse


async def _google_sign_in(client: AsyncClient, credential: str) -> tuple[int, dict[str, object]]:
    response = await client.post(
        "/api/v1/auth/google",
        json={"credential": credential},
    )
    return response.status_code, response.json()


@pytest.mark.asyncio
async def test_learner_login_and_progress(client: AsyncClient) -> None:
    """Learner can log in and fetch progress summary."""
    # NOTE: relies on seeded learner1 / learner123 from scripts.seed
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "learner1", "password": "learner123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    assert token

    progress = await client.get(
        "/api/v1/progress",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert progress.status_code == 200, progress.text
    body = progress.json()
    assert "current_level" in body
    assert "total_points" in body
    assert isinstance(body.get("quests"), list)


@pytest.mark.asyncio
async def test_admin_login_and_list_quests(client: AsyncClient) -> None:
    """Admin can log in and list quests."""
    # NOTE: relies on seeded admin1 / admin123 from scripts.seed
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin1", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]

    quests = await client.get(
        "/api/v1/admin/quests",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert quests.status_code == 200, quests.text
    quest_list = quests.json()
    assert isinstance(quest_list, list)
    assert len(quest_list) >= 1


@pytest.mark.asyncio
async def test_admin_cannot_reuse_order_rank(client: AsyncClient) -> None:
    """Creating a quest with an existing order_rank returns 400."""
    # Login as admin
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin1", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]

    # Get an existing quest to reuse its order_rank
    quests = await client.get(
        "/api/v1/admin/quests",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert quests.status_code == 200, quests.text
    existing = quests.json()
    assert existing, "Expected at least one quest in admin list"
    used_order = existing[0]["order_rank"]

    payload = {
        "title": "Duplicate order test",
        "description": "Should fail because order_rank is reused.",
        "level": 1,
        "order_rank": used_order,
        "initial_code": "print('hello')",
        "solution_code": "print('hello')",
        "explanation": "N/A",
    }
    create = await client.post(
        "/api/v1/admin/quests",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create.status_code == 400
    body = create.json()
    assert "order" in body.get("detail", "").lower()


@pytest.mark.asyncio
async def test_admin_remove_learner(client: AsyncClient) -> None:
    """Admin can remove a learner (US-014). Removed learner cannot log in."""
    import uuid

    # Register a new learner
    uid = str(uuid.uuid4())[:8]
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "username": f"toremove_{uid}",
            "email": f"toremove_{uid}@test.dev",
            "password": "test123",
            "role": "learner",
        },
    )
    assert reg.status_code == 201, reg.text

    # Login as admin
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin1", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]

    # Get user list and find the new learner
    users_resp = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert users_resp.status_code == 200, users_resp.text
    users = users_resp.json()
    target = next((u for u in users if u["username"] == f"toremove_{uid}"), None)
    assert target is not None, f"Expected toremove_{uid} in users list"

    # Remove the learner
    delete_resp = await client.delete(
        f"/api/v1/admin/users/{target['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_resp.status_code == 204, delete_resp.text

    # Verify learner cannot log in
    learner_login = await client.post(
        "/api/v1/auth/login",
        data={"username": f"toremove_{uid}", "password": "test123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert learner_login.status_code == 401, learner_login.text

    # Verify learner is no longer in admin users list
    users_after = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert users_after.status_code == 200
    usernames = [u["username"] for u in users_after.json()]
    assert f"toremove_{uid}" not in usernames


@pytest.mark.asyncio
async def test_admin_purge_submissions(client: AsyncClient) -> None:
    """Admin can trigger submission purge (NFR-11.2)."""
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin1", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]

    resp = await client.post(
        "/api/v1/admin/purge-submissions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "purged" in body
    assert "retention_days" in body
    assert isinstance(body["purged"], int) and body["purged"] >= 0


@pytest.mark.asyncio
async def test_google_sign_in_links_existing_password_account(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Google sign-in should reuse an existing account when the email matches."""

    existing_email = "google-link@test.dev"
    register = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "googlelinkuser",
            "email": existing_email,
            "password": "password123",
            "role": "learner",
        },
    )
    assert register.status_code == 201, register.text

    def fake_verify_google_credential(credential: str) -> dict[str, str]:
        assert credential == "google-token"
        return {
            "sub": "google-sub-123",
            "email": existing_email,
            "email_verified": "true",
            "name": "Google Link User",
            "given_name": "Google",
            "family_name": "Link",
        }

    monkeypatch.setattr("app.services.auth_service.verify_google_credential", fake_verify_google_credential)

    status, body = await _google_sign_in(client, "google-token")
    assert status == 200, body
    assert body["access_token"]

    me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me.status_code == 200, me.text
    me_body = me.json()
    assert me_body["email"] == existing_email
    assert me_body["username"] == "googlelinkuser"


@pytest.mark.asyncio
async def test_google_sign_in_creates_learner_account(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Google sign-in should create a new learner when no matching account exists."""

    def fake_verify_google_credential(credential: str) -> dict[str, str]:
        assert credential == "new-google-token"
        return {
            "sub": "google-sub-999",
            "email": "new-google-user@test.dev",
            "email_verified": "true",
            "name": "New Google User",
            "given_name": "New",
            "family_name": "User",
        }

    monkeypatch.setattr("app.services.auth_service.verify_google_credential", fake_verify_google_credential)

    status, body = await _google_sign_in(client, "new-google-token")
    assert status == 200, body
    assert body["access_token"]

    me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me.status_code == 200, me.text
    me_body = me.json()
    assert me_body["email"] == "new-google-user@test.dev"
    assert me_body["role"] == "learner"


@pytest.mark.asyncio
async def test_google_start_redirects_to_google_authorize_endpoint(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The backend should start Google sign-in and redirect the browser to Google."""

    monkeypatch.setenv("GOOGLE_CLIENT_ID", "google-client-id.apps.googleusercontent.com")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "google-client-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://testserver/api/v1/auth/google/callback")
    monkeypatch.setenv("FRONTEND_BASE_URL", "http://localhost:5173")

    from app.config import get_settings

    get_settings.cache_clear()

    response = await client.get("/api/v1/auth/google/start?flow=login", follow_redirects=False)
    assert response.status_code in (301, 302, 303, 307, 308), response.text

    location = response.headers["location"]
    parsed = urlparse(location)
    assert parsed.netloc == "accounts.google.com"
    params = parse_qs(parsed.query)
    assert params["client_id"] == ["google-client-id.apps.googleusercontent.com"]
    assert params["response_type"] == ["code"]
    assert params["redirect_uri"] == ["http://testserver/api/v1/auth/google/callback"]
    assert "openid" in params["scope"][0]
    assert "email" in params["scope"][0]
    assert "profile" in params["scope"][0]
    assert "state" in params
    assert response.cookies.get("codequest_google_oauth_state")


@pytest.mark.asyncio
async def test_google_exchange_returns_app_token(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The backend should exchange the Google handoff code for the app JWT."""

    monkeypatch.setenv("GOOGLE_CLIENT_ID", "google-client-id.apps.googleusercontent.com")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "google-client-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://testserver/api/v1/auth/google/callback")
    monkeypatch.setenv("FRONTEND_BASE_URL", "http://localhost:5173")

    from app.config import get_settings

    get_settings.cache_clear()

    from app.services import auth_service as auth_service_module
    from app.schemas.auth import Token

    def fake_redeem_google_handoff_code(self, handoff_code: str):
        assert handoff_code == "handoff-token"
        return Token(access_token="app-token")

    monkeypatch.setattr(auth_service_module.AuthService, "redeem_google_handoff_code", fake_redeem_google_handoff_code)

    response = await client.post(
        "/api/v1/auth/google/exchange",
        json={"code": "handoff-token"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"

