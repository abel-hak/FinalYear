import pytest
from httpx import AsyncClient


async def _admin_token(client: AsyncClient) -> str:
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin1", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


@pytest.mark.asyncio
async def test_admin_stats_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/admin/stats")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_admin_stats_shape(client: AsyncClient) -> None:
    token = await _admin_token(client)
    resp = await client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "total_users" in body
    assert "quests_completed" in body
    assert "total_quests" in body
    assert "completion_rate_pct" in body


@pytest.mark.asyncio
async def test_admin_analytics_shape(client: AsyncClient) -> None:
    token = await _admin_token(client)
    resp = await client.get(
        "/api/v1/admin/analytics",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert isinstance(body.get("quest_completion"), list)
    assert isinstance(body.get("difficulty_distribution"), list)
    assert isinstance(body.get("weekly_activity"), list)


@pytest.mark.asyncio
async def test_admin_quest_quality_report_shape(client: AsyncClient) -> None:
    token = await _admin_token(client)
    resp = await client.get(
        "/api/v1/admin/quests/quality",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "total_quests" in body
    assert "quests_with_issues" in body
    assert isinstance(body.get("items"), list)
