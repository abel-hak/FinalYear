## CodeQuest - Testing Guide

### 1. Backend automated tests (pytest)

**Prereqs**
- PostgreSQL running and reachable via `DATABASE_URL` / `DATABASE_URL_SYNC` in `.env`.
- Backend venv activated in `backend` folder.
- Seed data present (or re-seed before tests).

**Reset and seed database (recommended before running tests)**

```bash
cd backend
python -m scripts.reset_and_seed
```

This creates:
- Learner: `learner1` / `learner123`
- Admin: `admin1` / `admin123`
- Three sample quests with test cases.

**Run tests**

```bash
cd backend
pytest
```

Current tests cover:
- Learner login + `GET /api/v1/progress`
- Admin login + `GET /api/v1/admin/quests`
- Admin quest creation validation for duplicate `order_rank`.

### 2. Frontend manual test checklist

**Setup**

Backend:

```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```

#### 2.1 Learner flow

- Go to `http://localhost:3000/login`
  - Log in as `learner1` / `learner123`
  - Expect redirect to `/learner/dashboard`
- On `/learner/dashboard`:
  - See level, XP, and quest list with statuses `completed` / `current` / `locked`.
  - Click the current quest → `/learner/quests/<uuid>`
- On quest page:
  - Run incorrect code → status shows **Failed**, stderr/stdout visible.
  - Run correct code → status shows **Passed**, stdout correct.
  - Go back to dashboard and confirm:
    - Quest now `completed`
    - Next quest becomes `current`
    - XP increased.

#### 2.2 Admin flow

- Go to `http://localhost:3000/login`
  - Log in as `admin1` / `admin123`
  - Expect redirect to `/admin/dashboard`
- On `/admin/dashboard`:
  - Existing quests list visible.
  - Create a new quest using an unused **Order** (e.g. 4) → quest is created and appears in list.
  - Try to create another quest with an already-used order (e.g. 1) → form shows a validation error (duplicate order rank), not a generic fetch error.

#### 2.3 Auth & RBAC guards

- With **no token**:
  - Visit `/learner/dashboard` or `/admin/dashboard` → redirected to `/login`.
- Logged in as **learner**:
  - Header shows learner role and learner dashboard link.
  - Visiting `/admin/dashboard` shows “Admins only area” message and link back to learner dashboard.
- Logged in as **admin**:
  - Header shows admin role and admin dashboard link.
  - Visiting `/learner/dashboard` shows “Learner area only” message and link back to admin dashboard.

