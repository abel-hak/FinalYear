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
  - 9 Python debugging quests across 3 difficulty levels.
  - Submissions run in a sandboxed Python process with a 5‑second timeout.
  - Detailed feedback: expected vs actual output, plus raw stdout/stderr.

- **Hints & AI assistance**
  - AI hints (OpenAI-compatible API) with per-quest quotas.
  - Staged hints: Hint 1 (general), Hint 2 (specific), Hint 3 (very specific, no full solution).
  - AI failure explanation: explains *what* went wrong and *why*.
  - Admin: AI quest generation (auto-generates new debugging quests).

- **Learning paths**
  - 3 level-based paths (Beginner, Intermediate, Advanced).
  - Paths unlock as you complete earlier levels.

- **Progress & gamification**
  - XP and level system (first-time completions).
  - Daily streak tracking.
  - Achievements with tiers (common, rare, epic, legendary).
  - Leaderboard with all-time / weekly / monthly views.

- **Admin tools**
  - Quest CRUD + test case management.
  - Learning path management.
  - User management (view / remove learners).
  - Analytics: quest completion rates, difficulty distribution, weekly activity.
  - Content quality checker (quests missing tags/explanations/test cases).

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
# Edit .env: set DATABASE_URL and DATABASE_URL_SYNC
# Example:
#   DATABASE_URL=postgresql+asyncpg://codequest:codequest@localhost:5432/codequest
#   DATABASE_URL_SYNC=postgresql+psycopg://codequest:codequest@localhost:5432/codequest

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
├── backend/                  # FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── main.py           # FastAPI entry point, CORS, router mounting
│   │   ├── config.py         # Env-based config (pydantic-settings)
│   │   ├── api/              # Route handlers (auth, quests, progress, admin, hints, etc.)
│   │   ├── core/             # Sandbox, AI helpers, rate limiting, security
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic layer
│   │   └── db/               # DB session + base model
│   ├── alembic/              # DB migrations
│   ├── scripts/              # Seed scripts, maintenance utilities
│   └── tests/                # pytest test suite
│
├── frontend/                 # React SPA (Vite + shadcn/ui)
│   └── src/
│       ├── api/backend.ts    # Type-safe API wrapper + auth helpers
│       ├── pages/            # Route pages (Login, Quests, Achievements, Admin, etc.)
│       ├── components/       # Reusable UI components
│       └── contexts/         # ThemeContext (dark/light mode)
│
└── docs/                     # Schema, gap analysis, testing guide
```

---

## 5. Running Tests

```bash
cd backend
pytest -q
```

Tests cover: auth flows, quest submission, rate limiting, sandbox timeouts, AI hints, admin actions.

See `docs/TESTING.md` for the full manual + automated testing guide.

---

## 6. Deployment

The app is deployed and auto-deploys on push to `main`.

| Service | Platform | Root Dir | Key Config |
|---------|----------|----------|------------|
| Frontend | Vercel | `frontend/` | `VITE_API_URL` = backend URL |
| Backend | Render | `backend/` | `DATABASE_URL`, `DATABASE_URL_SYNC`, `PYTHON_VERSION=3.11.9` |
| Database | Render PostgreSQL | — | Credentials in Render dashboard |

---

## 7. API Routes (all under `/api/v1`)

| Module | Key Endpoints |
|--------|---------------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Quests | `GET /quests/:id`, `POST /quests/:id/submit` |
| Progress | `GET /progress`, `GET /progress/review-suggestions` |
| Hints | `POST /ai/hint` |
| Explain | `POST /ai/explain-failure` |
| Leaderboard | `GET /leaderboard` |
| Learning Paths | `GET /learning-paths`, `GET /learning-paths/:id` |
| Achievements | `GET /achievements` |
| Admin | `GET /admin/stats`, `GET /admin/analytics`, CRUD for quests/paths/users |

Full interactive docs at `/docs` on the backend.

---

## 8. Docs

- `docs/SCHEMA.md` – Database schema, relations, indexes.
- `docs/GAP_ANALYSIS.md` – How the implementation maps to the project specification.
- `docs/TESTING.md` – Manual + automated testing strategy.
