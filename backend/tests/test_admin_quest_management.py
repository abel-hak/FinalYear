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


async def _create_admin_quest(client: AsyncClient, token: str, *, order_rank: int) -> dict:
    resp = await client.post(
        "/api/v1/admin/quests",
        json={
            "title": "Admin Quest Mgmt Test",
            "description": "Quest for admin quest management tests.",
            "level": 1,
            "order_rank": order_rank,
            "initial_code": "def solve():\n    return 0",
            "solution_code": "def solve():\n    return 1",
            "explanation": "Return the correct value.",
            "tags": ["admin", "test"],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.mark.asyncio
async def test_admin_can_update_and_soft_delete_quest(client: AsyncClient) -> None:
    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    quests_resp = await client.get("/api/v1/admin/quests", headers=headers)
    assert quests_resp.status_code == 200, quests_resp.text
    existing = quests_resp.json()
    max_rank = max((q["order_rank"] for q in existing), default=0)

    quest = await _create_admin_quest(client, token, order_rank=max_rank + 100)
    quest_id = quest["id"]

    update_resp = await client.put(
        f"/api/v1/admin/quests/{quest_id}",
        json={"title": "Admin Quest Updated", "tags": ["updated"]},
        headers=headers,
    )
    assert update_resp.status_code == 200, update_resp.text
    updated = update_resp.json()
    assert updated["title"] == "Admin Quest Updated"
    assert updated["tags"] == ["updated"]

    delete_resp = await client.delete(f"/api/v1/admin/quests/{quest_id}", headers=headers)
    assert delete_resp.status_code == 204, delete_resp.text

    after_resp = await client.get("/api/v1/admin/quests", headers=headers)
    assert after_resp.status_code == 200, after_resp.text
    deleted = next((q for q in after_resp.json() if q["id"] == quest_id), None)
    assert deleted is not None
    assert deleted["is_deleted"] is True


@pytest.mark.asyncio
async def test_admin_testcase_crud_flow(client: AsyncClient) -> None:
    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    quests_resp = await client.get("/api/v1/admin/quests", headers=headers)
    assert quests_resp.status_code == 200, quests_resp.text
    existing = quests_resp.json()
    max_rank = max((q["order_rank"] for q in existing), default=0)

    quest = await _create_admin_quest(client, token, order_rank=max_rank + 101)
    quest_id = quest["id"]

    create_tc_resp = await client.post(
        f"/api/v1/admin/quests/{quest_id}/testcases",
        json={
            "input_data": {"x": 1},
            "expected_output": "1",
            "is_hidden": False,
        },
        headers=headers,
    )
    assert create_tc_resp.status_code == 201, create_tc_resp.text
    test_case = create_tc_resp.json()
    test_case_id = test_case["id"]

    list_tc_resp = await client.get(f"/api/v1/admin/quests/{quest_id}/testcases", headers=headers)
    assert list_tc_resp.status_code == 200, list_tc_resp.text
    listed_ids = [tc["id"] for tc in list_tc_resp.json()]
    assert test_case_id in listed_ids

    delete_tc_resp = await client.delete(f"/api/v1/admin/testcases/{test_case_id}", headers=headers)
    assert delete_tc_resp.status_code == 204, delete_tc_resp.text

    list_after_delete_resp = await client.get(
        f"/api/v1/admin/quests/{quest_id}/testcases",
        headers=headers,
    )
    assert list_after_delete_resp.status_code == 200, list_after_delete_resp.text
    listed_after_delete = [tc["id"] for tc in list_after_delete_resp.json()]
    assert test_case_id not in listed_after_delete

    cleanup_resp = await client.delete(f"/api/v1/admin/quests/{quest_id}", headers=headers)
    assert cleanup_resp.status_code == 204, cleanup_resp.text
