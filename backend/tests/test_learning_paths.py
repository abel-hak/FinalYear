"""Learning paths integration tests."""

import pytest
from httpx import AsyncClient


async def _login_learner(client: AsyncClient) -> str:
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "learner1", "password": "learner123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_learning_paths_list_returns_collection(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/learning-paths")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert isinstance(body, list)


@pytest.mark.asyncio
async def test_learning_path_detail_requires_auth(client: AsyncClient) -> None:
    listing = await client.get("/api/v1/learning-paths")
    assert listing.status_code == 200, listing.text
    paths = listing.json()
    if not paths:
        return

    pid = paths[0]["id"]
    resp = await client.get(f"/api/v1/learning-paths/{pid}")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_learning_path_detail_returns_expected_shape(client: AsyncClient) -> None:
    token = await _login_learner(client)
    listing = await client.get(
        "/api/v1/learning-paths",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert listing.status_code == 200, listing.text
    paths = listing.json()
    if not paths:
        return

    pid = paths[0]["id"]
    detail = await client.get(
        f"/api/v1/learning-paths/{pid}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["id"] == pid
    assert "quests" in body
    assert isinstance(body["quests"], list)
