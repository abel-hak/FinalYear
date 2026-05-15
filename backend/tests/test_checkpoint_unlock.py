import pytest
from httpx import AsyncClient
import uuid


async def _admin_token(client: AsyncClient) -> str:
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin1", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


async def _login_learner(client: AsyncClient) -> str:
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "learner1", "password": "learner123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


async def _register_and_login_fresh_learner(client: AsyncClient) -> str:
    uid = str(uuid.uuid4())[:8]
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "username": f"checkpoint_{uid}",
            "email": f"checkpoint_{uid}@test.dev",
            "password": "test123",
            "role": "learner",
        },
    )
    assert reg.status_code == 201, reg.text

    login = await client.post(
        "/api/v1/auth/login",
        data={"username": f"checkpoint_{uid}", "password": "test123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


async def _create_quest_with_testcase(
    client: AsyncClient,
    headers: dict[str, str],
    *,
    title: str,
    order_rank: int,
    solution_code: str,
    expected_output: str,
) -> str:
    create_resp = await client.post(
        "/api/v1/admin/quests",
        json={
            "title": title,
            "description": f"{title} description",
            "level": 1,
            "order_rank": order_rank,
            "xp_reward": 10,
            "initial_code": "print('wrong')",
            "solution_code": solution_code,
            "explanation": "Fix the output.",
            "tags": ["checkpoint", "path"],
        },
        headers=headers,
    )
    assert create_resp.status_code == 201, create_resp.text
    quest_id = create_resp.json()["id"]

    testcase_resp = await client.post(
        f"/api/v1/admin/quests/{quest_id}/testcases",
        json={"input_data": {}, "expected_output": expected_output, "is_hidden": False},
        headers=headers,
    )
    assert testcase_resp.status_code == 201, testcase_resp.text
    return quest_id


@pytest.mark.asyncio
async def test_checkpoint_unlocks_path(client: AsyncClient) -> None:
    # Admin picks an existing quest and creates a level-2 path with it as checkpoint
    admin_token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {admin_token}"}

    quests_resp = await client.get("/api/v1/admin/quests", headers=headers)
    assert quests_resp.status_code == 200, quests_resp.text
    quests = quests_resp.json()
    assert quests, "Expected at least one quest for checkpoint test"
    quest = quests[0]
    quest_id = quest["id"]
    solution_code = quest.get("solution_code")
    assert solution_code, "Quest must have solution code for test"

    create_path_resp = await client.post(
        "/api/v1/admin/learning-paths",
        json={
            "title": "Checkpoint Test Path",
            "description": "Path with checkpoint",
            "level": 2,
            "order_rank": 999,
            "checkpoint_quest_id": quest_id,
        },
        headers=headers,
    )
    assert create_path_resp.status_code == 201, create_path_resp.text
    path_id = create_path_resp.json()["id"]

    # Learner should see the path as locked and receive checkpoint info
    token = await _login_learner(client)
    learner_headers = {"Authorization": f"Bearer {token}"}

    list_resp = await client.get("/api/v1/learning-paths", headers=learner_headers)
    assert list_resp.status_code == 200, list_resp.text
    listed_paths = list_resp.json()
    created_path = next((item for item in listed_paths if item["id"] == path_id), None)
    assert created_path is not None, "Created path should appear in the list response"
    assert created_path["unlocked"] is False
    assert created_path.get("checkpoint_quest_info"), "Expected checkpoint_quest_info in list response"

    detail = await client.get(f"/api/v1/learning-paths/{path_id}", headers=learner_headers)
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["is_unlocked"] is False
    assert body.get("checkpoint_quest_info"), "Expected checkpoint_quest_info in response"

    # Submit correct solution for checkpoint quest
    submit_resp = await client.post(
        f"/api/v1/quests/{quest_id}/submit",
        json={"code": solution_code},
        headers=learner_headers,
    )
    assert submit_resp.status_code == 200, submit_resp.text
    sub = submit_resp.json()
    assert sub["passed"] is True

    # After passing, the path should be unlocked for learner
    list_after = await client.get("/api/v1/learning-paths", headers=learner_headers)
    assert list_after.status_code == 200, list_after.text
    updated_path = next((item for item in list_after.json() if item["id"] == path_id), None)
    assert updated_path is not None
    assert updated_path["unlocked"] is True

    detail_after = await client.get(f"/api/v1/learning-paths/{path_id}", headers=learner_headers)
    assert detail_after.status_code == 200, detail_after.text
    assert detail_after.json()["is_unlocked"] is True


@pytest.mark.asyncio
async def test_checkpoint_quest_detail_is_viewable_when_marked_as_checkpoint(client: AsyncClient) -> None:
    admin_token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {admin_token}"}

    quests_resp = await client.get("/api/v1/admin/quests", headers=headers)
    assert quests_resp.status_code == 200, quests_resp.text
    quests = quests_resp.json()

    checkpoint_quest = next((quest for quest in quests if int(quest["level"]) >= 2), None)
    assert checkpoint_quest is not None, "Expected an intermediate or advanced quest"

    create_path_resp = await client.post(
        "/api/v1/admin/learning-paths",
        json={
            "title": "Checkpoint View Test Path",
            "description": "Path with a checkpoint quest that should be viewable",
            "level": 3,
            "order_rank": 1000,
            "checkpoint_quest_id": checkpoint_quest["id"],
        },
        headers=headers,
    )
    assert create_path_resp.status_code == 201, create_path_resp.text

    token = await _login_learner(client)
    learner_headers = {"Authorization": f"Bearer {token}"}

    detail = await client.get(
        f"/api/v1/quests/{checkpoint_quest['id']}",
        headers=learner_headers,
    )
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["id"] == checkpoint_quest["id"]


@pytest.mark.asyncio
async def test_checkpoint_unlock_cascades_previous_path_and_keeps_new_path_sequential(client: AsyncClient) -> None:
    admin_token = await _admin_token(client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    quests_resp = await client.get("/api/v1/admin/quests", headers=admin_headers)
    assert quests_resp.status_code == 200, quests_resp.text
    existing_quests = quests_resp.json()
    checkpoint_quest = existing_quests[0]
    checkpoint_solution = checkpoint_quest.get("solution_code")
    assert checkpoint_solution, "Checkpoint quest needs solution code"

    min_rank = min((int(q["order_rank"]) for q in existing_quests), default=100)
    rank = min_rank - 50

    beginner_q1 = await _create_quest_with_testcase(
        client,
        admin_headers,
        title="Checkpoint Beginner Q1",
        order_rank=rank,
        solution_code="print('b1')",
        expected_output="b1",
    )
    beginner_q2 = await _create_quest_with_testcase(
        client,
        admin_headers,
        title="Checkpoint Beginner Q2",
        order_rank=rank + 1,
        solution_code="print('b2')",
        expected_output="b2",
    )
    intermediate_q1 = await _create_quest_with_testcase(
        client,
        admin_headers,
        title="Checkpoint Intermediate Q1",
        order_rank=rank + 2,
        solution_code="print('i1')",
        expected_output="i1",
    )
    intermediate_q2 = await _create_quest_with_testcase(
        client,
        admin_headers,
        title="Checkpoint Intermediate Q2",
        order_rank=rank + 3,
        solution_code="print('i2')",
        expected_output="i2",
    )

    beginner_path_resp = await client.post(
        "/api/v1/admin/learning-paths",
        json={
            "title": "Checkpoint Beginner Path",
            "description": "Beginner prerequisite path",
            "level": 1,
            "order_rank": 880,
            "language": "python",
        },
        headers=admin_headers,
    )
    assert beginner_path_resp.status_code == 201, beginner_path_resp.text
    beginner_path_id = beginner_path_resp.json()["id"]

    intermediate_path_resp = await client.post(
        "/api/v1/admin/learning-paths",
        json={
            "title": "Checkpoint Intermediate Path",
            "description": "Intermediate path unlocked by checkpoint",
            "level": 2,
            "order_rank": 881,
            "language": "python",
            "checkpoint_quest_id": checkpoint_quest["id"],
        },
        headers=admin_headers,
    )
    assert intermediate_path_resp.status_code == 201, intermediate_path_resp.text

    for quest_id in [beginner_q1, beginner_q2]:
        add_resp = await client.post(
            f"/api/v1/admin/learning-paths/{beginner_path_id}/quests",
            json={"quest_id": quest_id},
            headers=admin_headers,
        )
        assert add_resp.status_code == 201, add_resp.text

    intermediate_path_id = intermediate_path_resp.json()["id"]
    for quest_id in [intermediate_q1, intermediate_q2]:
        add_resp = await client.post(
            f"/api/v1/admin/learning-paths/{intermediate_path_id}/quests",
            json={"quest_id": quest_id},
            headers=admin_headers,
        )
        assert add_resp.status_code == 201, add_resp.text

    learner_token = await _register_and_login_fresh_learner(client)
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # Before checkpoint unlock, beginner path is sequential and intermediate q2 is locked.
    beginner_q2_before = await client.get(f"/api/v1/quests/{beginner_q2}", headers=learner_headers)
    assert beginner_q2_before.status_code == 403, beginner_q2_before.text

    intermediate_q2_before = await client.get(f"/api/v1/quests/{intermediate_q2}", headers=learner_headers)
    assert intermediate_q2_before.status_code == 403, intermediate_q2_before.text

    unlock_resp = await client.post(
        f"/api/v1/quests/{checkpoint_quest['id']}/submit",
        json={"code": checkpoint_solution},
        headers=learner_headers,
    )
    assert unlock_resp.status_code == 200, unlock_resp.text
    assert unlock_resp.json()["passed"] is True

    # Cascading rule: all beginner path quests become accessible after intermediate checkpoint unlock.
    beginner_q2_after = await client.get(f"/api/v1/quests/{beginner_q2}", headers=learner_headers)
    assert beginner_q2_after.status_code == 200, beginner_q2_after.text

    # Intermediate path still follows sequential flow: q1 accessible, q2 still locked.
    intermediate_q1_detail = await client.get(f"/api/v1/quests/{intermediate_q1}", headers=learner_headers)
    assert intermediate_q1_detail.status_code == 200, intermediate_q1_detail.text

    intermediate_q2_still_locked = await client.get(f"/api/v1/quests/{intermediate_q2}", headers=learner_headers)
    assert intermediate_q2_still_locked.status_code == 403, intermediate_q2_still_locked.text

    # Wrong submission on now-accessible quest increments penalty preview.
    before_fail = intermediate_q1_detail.json()
    wrong_resp = await client.post(
        f"/api/v1/quests/{intermediate_q1}/submit",
        json={"code": "print('wrong')"},
        headers=learner_headers,
    )
    assert wrong_resp.status_code == 200, wrong_resp.text
    assert wrong_resp.json()["passed"] is False

    after_fail_detail = await client.get(f"/api/v1/quests/{intermediate_q1}", headers=learner_headers)
    assert after_fail_detail.status_code == 200, after_fail_detail.text
    after_fail = after_fail_detail.json()
    assert after_fail["failed_attempts_count"] >= before_fail["failed_attempts_count"] + 1
    assert after_fail["xp_penalty_preview"] >= before_fail["xp_penalty_preview"] + 1

    # Passing intermediate q1 unlocks intermediate q2.
    pass_resp = await client.post(
        f"/api/v1/quests/{intermediate_q1}/submit",
        json={"code": "print('i1')"},
        headers=learner_headers,
    )
    assert pass_resp.status_code == 200, pass_resp.text
    assert pass_resp.json()["passed"] is True

    intermediate_q1_after_pass = await client.get(f"/api/v1/quests/{intermediate_q1}", headers=learner_headers)
    assert intermediate_q1_after_pass.status_code == 200, intermediate_q1_after_pass.text
    assert intermediate_q1_after_pass.json().get("next_id") == intermediate_q2

    intermediate_q2_after = await client.get(f"/api/v1/quests/{intermediate_q2}", headers=learner_headers)
    assert intermediate_q2_after.status_code == 200, intermediate_q2_after.text
