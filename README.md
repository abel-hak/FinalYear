# CodeQuest – Debugging-Based Learning Platform

CodeQuest is a final-year project: a web platform where learners **debug broken Python code** instead of just reading tutorials.  
Each challenge is a *quest* with:

- Broken starter code (`initial_code`)
- Hidden tests and expected output
- Progressive hints (static + AI-powered)
- A **Knowledge Scroll** explaining the concept after completion

See `CODEQUEST_ANALYSIS_AND_PLAN.md` for the full analysis, requirements, and milestone breakdown.

---

## 1. Features (high level)

- **Quests & submissions**
  - 30+ Python debugging quests (levels 1–3).
  - Submissions run in a sandboxed Python process with a 5‑second timeout.
  - Detailed feedback: **expected vs actual output**, plus raw stdout/stderr.

- **Hints & AI assistance**
  - 3 static hints per quest (authored metadata).
  - AI hints (Groq/OpenAI‑compatible API) with:
    - Rate limiting and per‑quest hint quotas.
    - **Staged hints**: Hint 1 (general), Hint 2 (more specific), Hint 3 (very specific, no full solution).
    - Hint history visible in the sidebar.

- **Learning paths**
  - Level‑based paths (Beginner, Intermediate, Advanced).
  - Paths unlock as you complete earlier levels.
  - Path detail page shows quest status and curated learning resources.

- **Progress & gamification**
  - XP and level system (first‑time completions).
  - Daily streak tracking.
  - Achievements with tiers and progress (e.g. first quest, 5 quests, no‑hint completions, path completion).
  - Leaderboard with all‑time / weekly / monthly views, and “your rank” card.

- **Admin tools**
  - Quest CRUD + test case management.
  - Learning path management.
  - Analytics: quest completion rates, difficulty distribution, weekly activity.
  - Content quality checker (quests missing tags/explanations/test cases).
  - **AI Quest Generator** (admin‑only): generate a draft quest (broken code, solution, explanation, tags, expected output), then edit + approve.

---

## 2. Quick start

### 2.1 Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **PostgreSQL** 14+

### 2.2 Backend

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env: set DATABASE_URL and DATABASE_URL_SYNC to your PostgreSQL URL
# Example:
#   DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/codequest
#   DATABASE_URL_SYNC=postgresql://user:pass@localhost:5432/codequest

alembic upgrade head

# Seed with 30 quests and 3 learning paths
python -m scripts.reset_and_seed_30

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: `http://localhost:8000`  
- Docs: `http://localhost:8000/docs`  
- Health: `http://localhost:8000/health`

Default users after seeding:

- Learner: `learner@codequest.dev` / `learner123`
- Admin: `admin@codequest.dev` / `admin123`

### 2.3 Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: `http://localhost:3000`

Login as the **learner** to use the platform normally.  
Login as the **admin** to access admin dashboards, content management, analytics, and the AI quest generator.

---

## 3. Running tests

From `backend/`:

```bash
pytest -q
```

This runs:

- Auth and main flows (login, progress, admin actions)
- Hint APIs (remaining count, limits, auth)
- Quest submission behavior and rate limiting
- Sandbox behavior (timeouts, stdout/stderr)

---

## 4. Project structure

```text
FinalYear/
├── backend/                  # FastAPI, SQLAlchemy, PostgreSQL
│   ├── app/
│   │   ├── api/              # FastAPI routers (auth, quests, progress, hints, admin, leaderboard, paths, achievements)
│   │   ├── core/             # sandbox, AI helpers, rate limiting, security
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── config.py         # Settings (env-based)
│   └── scripts/              # seed, reseed, maintenance scripts
├── frontend/                 # React SPA (Vite + Tailwind + shadcn/ui)
│   ├── src/
│   │   ├── pages/            # Top-level routes (Quests, Quest, Paths, Leaderboard, Achievements, Admin)
│   │   ├── components/       # Shared UI, admin components, quest UI, hints, knowledge scroll, etc.
│   │   └── api/backend.ts    # Type-safe wrapper for backend API
├── docs/                     # SCHEMA, GAP_ANALYSIS, TESTING, etc.
├── CODEQUEST_ANALYSIS_AND_PLAN.md
└── README.md
```

---

## 5. Notable design choices

- **Execution sandbox**
  - Current MVP: separate Python process (`subprocess.run`) with a 5‑second timeout and temp file, no shared state.
  - All stdout/stderr captured and returned in the `SubmissionResult`.
  - For production, this would be replaced with a container‑based sandbox (documented in `SCHEMA.md` / GAP analysis).

- **Progress + paths**
  - Quests have a strict `order_rank` and `level`.
  - Path locking and quest locking are enforced server‑side:
    - You cannot navigate directly to locked quests (API returns 403).
    - `prev_id` / `next_id` in quest detail skip locked quests.

- **AI integration**
  - All AI calls go through `app/core/ai.py`.
  - Resilient behavior:
    - Retries on transient provider errors.
    - Circuit breaker when the provider repeatedly fails.
    - Short caching to avoid re‑asking the exact same hint/draft.
  - Strict prompts to avoid leaking full solutions.

---

## 6. Docs

- `docs/SCHEMA.md` – database schema, relations, important fields.
- `docs/GAP_ANALYSIS.md` – how the implementation maps to the specification and non‑functional requirements.
- `docs/TESTING.md` – manual + automated testing strategy.
- `CODEQUEST_ANALYSIS_AND_PLAN.md` – original project analysis, milestones, and architecture overview.

These can be referenced directly in the report or presentation.***
