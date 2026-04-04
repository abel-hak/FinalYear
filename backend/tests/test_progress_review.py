"""Progress review suggestions integration tests."""

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
async def test_review_suggestions_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/progress/review-suggestions")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_review_suggestions_returns_list_shape(client: AsyncClient) -> None:
    token = await _login_learner(client)
    resp = await client.get(
        "/api/v1/progress/review-suggestions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert isinstance(body, list)
    if body:
        item = body[0]
        assert "id" in item
        assert "title" in item
        assert "days_since_completion" in item
