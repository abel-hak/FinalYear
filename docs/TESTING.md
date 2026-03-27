## CodeQuest – Testing Guide

### 1. Backend Automated Tests (pytest)

**Prerequisites**
- PostgreSQL running and reachable via `DATABASE_URL` / `DATABASE_URL_SYNC` in `.env`.
- Backend venv activated in `backend/` folder.
- Seed data present (or re-seed before tests).

**Reset and seed database (recommended before running tests)**

```bash
cd backend
python -m scripts.reset_and_seed
```

This creates:
- Learner: `learner1` / `learner123`
- Admin: `admin1` / `admin123`
- Sample quests with test cases.
- Three level-by-level learning paths (Level 1, 2, 3).

**Run tests**

```bash
cd backend
pytest
```

Current tests cover:
- Learner login + `GET /api/v1/progress`
- Admin login + `GET /api/v1/admin/quests`
- Admin quest creation validation for duplicate `order_rank`
- Admin remove learner (US-014)
- Admin purge submissions (NFR-11.2)
- Quest submission (pass/fail, rate limit, System Busy)
- AI hints (remaining count, rate limit)

### 2. Frontend Manual Test Checklist

**Setup**

Backend:

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

#### 2.1 Learner flow

- Go to `http://localhost:5173/login`
  - Log in as `learner1` / `learner123`
  - Expect redirect to `/quests`
- On Quests page:
  - See level, XP, and quest list with statuses `completed` / `current` / `locked`.
  - Click the current quest → `/quest/<uuid>`
- On quest page:
  - Run incorrect code → status shows **Failed**, stderr/stdout visible.
  - Run correct code → status shows **Passed**, stdout correct.
  - Go back to quests and confirm:
    - Quest now `completed`
    - Next quest becomes `current`
    - XP increased.

#### 2.2 Admin flow

- Go to `http://localhost:5173/login`
  - Log in as `admin1` / `admin123`
  - Expect redirect to `/admin`
- On Admin Dashboard:
  - **Users** tab: list learners, remove user.
  - **Quests** tab: create/edit/delete quests; add test cases.
  - **Paths** tab: create/edit/delete learning paths; assign quests to paths.
  - **Analytics** tab: charts and stats.
  - Create a new quest using an unused **Order** → quest is created.
  - Try duplicate order rank → validation error.

#### 2.3 Auth & RBAC guards

- With **no token**:
  - Visit `/quests` or `/admin` → redirected to `/login`.
- Logged in as **learner**:
  - Header shows learner role.
  - Can access quests, achievements, leaderboard.
- Logged in as **admin**:
  - Header shows admin role.
  - Can access admin dashboard + all learner features.

#### 2.4 Learning paths

- Go to `/learning-paths` (logged in).
- Level 1 path is always unlocked.
- Level 2 and 3 paths show "Locked" until Level 1 (or 2) quests are complete.
- Click a path to see quests; locked paths show unlock hint.
