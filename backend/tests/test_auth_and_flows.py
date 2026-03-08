import pytest
from httpx import AsyncClient


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

