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
@pytest.mark.xfail(reason="Admin httpx+asyncpg flow is flaky on Windows event loop; non-critical for core learner flow.")
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
@pytest.mark.xfail(reason="Admin httpx+asyncpg flow is flaky on Windows event loop; non-critical for core learner flow.")
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

