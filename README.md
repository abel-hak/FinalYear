# CodeQuest – Debugging-Based Learning Platform

CodeQuest is a final-year project: a web platform where learners **debug broken Python code** instead of just reading tutorials.
Each challenge is a *quest* with:

- Broken starter code (`initial_code`)
- Hidden tests and expected output
- Progressive hints (static + AI-powered)
- A **Knowledge Scroll** explaining the concept after completion

---

## 1. Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18 + TypeScript, Vite, React Router, TanStack Query, shadcn/ui |
| **Backend** | Python 3.11+, FastAPI, async SQLAlchemy, Alembic (migrations), Pydantic |
| **Database** | PostgreSQL 14+ (asyncpg driver) |
| **Auth** | JWT (python-jose), bcrypt password hashing |
| **Hosting** | Vercel (frontend), Render (backend + PostgreSQL) |

---

## 2. Features

- **Quests & submissions**
  - Default seed includes 9 Python debugging quests across 3 levels.
  - Optional 30-quest seed pack is available for larger demos/tests.
  - Submissions run in a sandboxed Python process with a 5‑second timeout.
  - Detailed feedback: expected vs actual output, plus raw stdout/stderr.

- **Hints & AI assistance**
  - AI hints (OpenAI-compatible API) with per-quest quotas.
  - Hint budget endpoint to check remaining AI hints for a quest.
  - Staged hints: Hint 1 (general), Hint 2 (specific), Hint 3 (very specific, no full solution).
  - AI failure explanation: explains *what* went wrong and *why*.
  - Admin: AI quest generation (auto-generates new debugging quests).

- **Learning paths**
  - 3 level-based paths (Beginner, Intermediate, Advanced).
  - Paths unlock as you complete earlier levels.

- **Progress & gamification**
  - XP and level system (first-time completions).
  - Daily streak tracking.
  - Review suggestions based on spaced repetition interval.
  - Achievements with tiers (common, rare, epic, legendary).
  - Leaderboard with all-time / weekly / monthly views.

- **Admin tools**
  - Quest CRUD + test case management.
  - Learning path management.
  - User management (view / remove learners).
  - Analytics: quest completion rates, difficulty distribution, weekly activity.
  - Content quality checker (quests missing tags/explanations/test cases).
  - Submission retention cleanup endpoint.

---

## 3. Quick Start

### 3.1 Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **Docker** + **Docker Compose**

### 3.2 Backend

```bash
# from project root, start only the database service
docker compose up -d postgres

cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env: set DATABASE_URL and DATABASE_URL_SYNC at minimum
# Example:
#   DATABASE_URL=postgresql+asyncpg://codequest:codequest@localhost:5432/codequest
#   DATABASE_URL_SYNC=postgresql+psycopg://codequest:codequest@localhost:5432/codequest
# Optional AI config:
#   AI_API_BASE=https://api.openai.com/v1
#   AI_API_KEY=...
#   AI_MODEL=gpt-4o-mini
# Optional auth hardening:
#   JWT_SECRET_KEY=your-secret-key-min-32-chars
#   JWT_ALGORITHM=HS256

alembic upgrade head
python -m scripts.seed

uvicorn app.main:app --reload --port 8000
```

Optional checks and teardown:

```bash
# check DB health/logs
docker compose ps
docker compose logs -f postgres

# stop services when done
docker compose down
```

- API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

Default users after seeding:

| Role | Username | Password |
|------|----------|----------|
| Learner | `learner1` | `learner123` |
| Admin | `admin1` | `admin123` |

Optional larger seed pack:

```bash
cd backend
python -m scripts.reset_and_seed_30
```

This resets core tables and seeds 30 quests plus level-based learning paths.

### 3.3 Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: `http://localhost:5173`

The frontend reads `VITE_API_URL` from env (defaults to `http://localhost:8000`).

---

## 4. Project Structure

```
FinalYear/
├── docker-compose.yml        # Local PostgreSQL services (dev + test)
├── README.md                 # Project overview, setup, API docs
├── backend/                  # FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── main.py           # FastAPI entry point, CORS, router mounting
│   │   ├── config.py         # Env-based config (pydantic-settings)
│   │   ├── api/              # Route handlers (auth, quests, progress, admin, hints, etc.)
│   │   ├── core/             # Sandbox, AI helpers, rate limiting, security
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── repositories/     # Data access layer per aggregate
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic layer
│   │   └── db/               # DB session + base model
│   ├── alembic/              # DB migrations
│   ├── scripts/              # Seed, reset, backfill, maintenance utilities
│   └── tests/                # pytest test suite
│
├── frontend/                 # React SPA (Vite + shadcn/ui)
│   └── src/
│       ├── api/backend.ts    # Type-safe API wrapper + auth helpers
│       ├── pages/            # Route pages (Login, Quests, Achievements, Admin, etc.)
│       ├── components/       # Reusable UI components
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # Utilities and shared client helpers
│       └── contexts/         # App-wide React contexts
│
├── frontend_old/             # Legacy Next.js frontend (kept for reference)
└── docs/                     # Schema, gap analysis, testing guide
```

---

## 5. Running Tests

```bash
# from project root: start dedicated test postgres
docker compose up -d postgres_test

cd backend
# optional first-time setup for test DB credentials
cp .env.test.example .env.test

pytest -q
```

Test DB notes:

- Pytest uses `postgres_test` on port `5433` (not the dev DB on `5432`).
- Each test creates a fresh temporary database, seeds it, and drops it after the test finishes.
- Test connection templates and admin credentials are configured in `backend/.env.test`.

Tests cover: auth flows, quest submission, rate limiting, sandbox timeouts, AI hints, admin actions.

See `docs/TESTING.md` for the full manual + automated testing guide.

---

## 6. Backend Change Highlights

Recent backend changes reflected in the current codebase and migrations:

- Added performance indexes for progress/test-case lookups (`002_add_indexes_for_progress.py`).
- Added learner streak tracking (`003_add_learner_streak.py`).
- Added AI hint request tracking table and per-quest hint accounting (`004_add_hint_requests.py`).
- Added quest concept tags (`005_add_quest_tags.py`).
- Added learning paths + path-to-quest mapping (`006_add_learning_paths.py`).
- Added learning-path level field for level-based unlock behavior (`007_add_learning_path_level.py`).
- Added admin endpoints for quest quality checks, AI draft quest generation, learning-path quest assignment, and submission retention purge.

Maintenance scripts in `backend/scripts/` include:

- `seed.py`, `reset_and_seed.py` (default dataset)
- `seed_30_quests.py`, `reset_and_seed_30.py` (expanded dataset)
- `backfill_quest_tags.py`, `seed_learning_paths.py`, `upgrade_learning_paths.py`
- `fix_quest_newlines.py`, `purge_submissions.py`

---

## 7. Deployment

The app is deployed and auto-deploys on push to `main`.

| Service | Platform | Root Dir | Key Config |
|---------|----------|----------|------------|
| Frontend | Vercel | `frontend/` | `VITE_API_URL` = backend URL |
| Backend | Render | `backend/` | `DATABASE_URL`, `DATABASE_URL_SYNC`, `PYTHON_VERSION=3.11.9` |
| Database | Render PostgreSQL | — | Credentials in Render dashboard |

---

## 8. API Routes (all under `/api/v1`)

| Module | Key Endpoints |
|--------|---------------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Quests | `GET /quests`, `GET /quests/{quest_id}`, `POST /quests/{quest_id}/submit` |
| Progress | `GET /progress`, `GET /progress/review-suggestions` |
| Hints | `GET /hints/remaining?quest_id=...`, `POST /hints/ai` |
| Explain | `POST /ai/explain-failure` |
| Leaderboard | `GET /leaderboard?period=all|weekly|monthly&limit=...` |
| Learning Paths | `GET /learning-paths`, `GET /learning-paths/{path_id}` |
| Achievements | `GET /achievements` |
| Admin | `GET /admin/stats`, `GET /admin/users`, `GET /admin/analytics`, `GET /admin/quests/quality`, quest/test-case CRUD, learning-path CRUD + quest assignment, `POST /admin/quests/ai-draft`, `POST /admin/purge-submissions`, `DELETE /admin/users/{user_id}` |

Full interactive docs at `/docs` on the backend.

---

## 9. Docs

- `docs/SCHEMA.md` – Database schema, relations, indexes.
- `docs/GAP_ANALYSIS.md` – How the implementation maps to the project specification.
- `docs/TESTING.md` – Manual + automated testing strategy.
