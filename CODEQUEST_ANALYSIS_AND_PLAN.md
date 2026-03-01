# CodeQuest – Analysis, Development Plan & Milestones

## 1. Summary of Understanding

**CodeQuest** is a **debugging-based learning platform** for beginner Python programmers. The core idea is **“discover then learn”**: learners fix faulty or incomplete code in quests, then unlock a short concept explanation (Knowledge Scroll) after success.

### 1.1 Core Value Proposition
- **Problem:** Beginners know syntax from tutorials but struggle with real errors and debugging.
- **Solution:** Quest-based challenges with broken code → learner debugs → success unlocks theory (Knowledge Scroll). Optional AI hints that guide without giving the answer.

### 1.2 Main Features (from documentation)
| Area | What the system does |
|------|----------------------|
| **Quests** | Structured debugging challenges; each has initial (broken) code, solution code, description, level, and post-completion explanation. |
| **Code execution** | Run learner code in an **isolated sandbox** (5-second timeout, no network, resource limits). |
| **Validation** | Compare output against predefined test cases (hidden + visible); pass/fail and feedback. |
| **Progress** | Record completed quests; unlock next quest and Knowledge Scroll; visual progress map (Duolingo-style). |
| **Hints** | Context-aware AI hints (compare learner code vs reference); gradual, no direct answer. |
| **Roles** | **Learner** (quests, dashboard, analytics) and **Admin** (curriculum CRUD, analytics, user management). |
| **Auth** | JWT-based; sign up (Learner/Admin), login; RBAC for Admin vs Learner. |

### 1.3 Functional Requirements (FR)
- **FR-01:** Code submission & execution in isolated environment.
- **FR-02:** Quest engine compares output to predefined test cases.
- **FR-03:** Detailed feedback (pass/fail, error messages).
- **FR-04:** Timeout detection and notification (e.g. 5-second limit).
- **FR-05:** Record completion and unlock Knowledge Scroll + next quest.

### 1.4 Non-Functional (selected)
- **Business:** No access to next quest until verified; no persistent temp files; “System Busy” for system errors; rate limit (e.g. 5 submissions/minute per learner).
- **UI:** Web GUI, embedded code editor with syntax highlighting; admin dashboard with analytics; intuitive, gamified (badges/progress).
- **Performance:** Results within ~2s for 95% of requests; support ~50 concurrent executions.
- **Security:** RCE protection, HTTPS, secure password hashing, rate limiting, sandbox isolation.
- **Sandbox:** 5-second timeout, force-kill for infinite loops; one user’s sandbox must not affect others.

### 1.5 Database Entities (from doc)
- **User:** user_id, username, email, password_hash, role (Admin/Learner), is_deleted, audit fields.
- **Learner:** learner_id, user_id (FK), current_level, total_points, is_deleted, audit fields.
- **Admin:** admin_id, user_id (FK), admin_status, is_deleted, audit fields.
- **Quest:** id, title, description, level, initial_code, solution_code, explanation (and ordering for curriculum).
- **TestCase:** test_case_id, quest_id (FK), input_data, expected_output, is_hidden, is_deleted, audit fields.

We will add:
- **Submission / QuestProgress:** To record attempts and which quests each learner has completed (for progress map and unlocks).

### 1.6 System Architecture (high level)
- **Client:** Browser (desktop-first).
- **Application server:** Auth, quest metadata, validation orchestration, JWT.
- **Sandbox cluster:** Isolated execution (containers/processes), 5s timeout, no network.
- **Database server:** PostgreSQL (main DB + optional separate log storage).
- **AI service (optional):** External API for hints (HTTPS).

Subsystems: UI, User Management, Quest Management, Execution & Validation, AI & Analytics, Database, Logging & Monitoring, Secure Sandbox.

---

## 2. Decisions (from documentation)

The following decisions are taken from the project documentation so the plan matches the spec.

1. **Sandbox implementation**  
   Doc (Section 1.6.3): *"the backend will be built using... **Go for codex building the code execution sandbox**. If the sand-box found to be difficult for building using Go **we may revert way to using a Java-Script Library Pyodide**."*  
   **Decision: B) Backend sandbox** (Go or Docker + Python) as primary; Pyodide is the documented fallback if the backend sandbox is too difficult. We will implement a **backend sandbox** (Docker + Python subprocess with 5s timeout) for MVP so security and isolation match the doc; Go can be swapped in later if desired.

2. **AI hints (LLM)**  
   Doc (Phase 4, Section 1.7): *"The **error comparison and rule based hint logic will be implemented**. The **AI API integration** and prompt optimization **occur here**."*  
   **Decision: Start with rule-based / template hints**, then add LLM in a later phase. First version implements error comparison and rule-based gradual hints; LLM integration follows as in the timeline.

3. **Admin creation**  
   Doc (Use Case 7, Table 2.28): *"The user **selects their role (Learner or Admin)**"* at registration.  
   **Decision: Anyone can register as Admin** from the sign-up form (role selection at registration). The doc specifies role choice on sign-up; RBAC and server-side role checks (no client-side trust) still apply.

4. **Programming language**  
   Doc: Scope is *"beginners learning **Python**"*; NFR-08.1 states *"The system's **future expansion** into new programming languages (e.g., Rust, Java)**."*  
   **Decision: Python only for the first version**; architecture will be **ready for more languages later** (e.g. language field on Quest, execution abstraction by language) with only Python implemented initially.

5. **Progress map**  
   Doc (Scenario 7, Use Case 9): *"**linear**, step-by-step visual layout (similar to Duolingo) showing completed, current, and locked quests"* and *"subsequent challenges that were previously locked."*  
   **Decision: Strictly linear** (Quest 1 → 2 → 3 → …). No branches or multiple tracks in the first version; quests have an order and unlocking is sequential.

---

## 3. Recommended Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | **Next.js (React)** | Per doc; SSR/SSG, API routes if needed, good DX and deployment. |
| **UI / styling** | **Tailwind CSS** | Fast, consistent, good for dashboards and code editor layout. |
| **Code editor** | **Monaco Editor** (or **CodeMirror 6**) | Syntax highlighting, Python support, familiar IDE feel. |
| **Backend API** | **Python (Flask or FastAPI)** | Doc specifies Python backend; FastAPI gives async, OpenAPI, validation. |
| **Database** | **PostgreSQL** | Per doc; ACID, RLS possible, good for progress and analytics. |
| **ORM** | **SQLAlchemy 2.x** | Mature, works well with PostgreSQL and Flask/FastAPI. |
| **Auth** | **JWT** (e.g. **PyJWT** + **bcrypt**/**passlib**) | Per doc; stateless, role in token or DB. |
| **Code execution (MVP)** | **Backend sandbox:** Docker + Python subprocess (5s timeout); Go service optional later; Pyodide = doc fallback | Per doc: Go/sandbox first; we use Python subprocess in Docker for MVP. |
| **AI hints** | **Rule-based / template hints** first; **LLM (OpenAI or compatible)** in a later phase | Per doc Phase 4: rule-based hint logic then AI API integration. |
| **Hosting** | **Cloud (e.g. AWS/GCP/Azure)** as in doc | App on App Service/ECS/Cloud Run; DB managed (RDS/Cloud SQL); optional serverless. |

**Suggested combination for a clean, scalable setup:**
- **Frontend:** Next.js 14+ (App Router), Tailwind, Monaco/CodeMirror.
- **Backend:** FastAPI (Python 3.11+), SQLAlchemy 2, PostgreSQL.
- **Auth:** JWT (access + optional refresh), secure cookies or `Authorization` header, RBAC.
- **Execution:** Backend sandbox (Docker + Python subprocess, 5s timeout, resource limits). Architecture allows adding a Go runner or Pyodide fallback later.

---

## 4. Development Plan (Phased)

### Phase 1 – Project setup & foundation
- Repo structure (monorepo or separate frontend/backend).
- Backend: FastAPI app, env config, health check.
- Frontend: Next.js app, Tailwind, basic layout and routing.
- Database: PostgreSQL + SQLAlchemy models for User, Learner, Admin, Quest, TestCase, and progress/submissions.
- Migrations (e.g. Alembic) and seed script for at least one quest and test user.

### Phase 2 – Database design & models
- Finalize schema (add submission/quest_completion table if not in Phase 1).
- Implement all entities and relationships; indexes for progress and submissions.
- Seed data: 2–3 sample quests with test cases, one Learner, one Admin.

### Phase 3 – Backend APIs
- Auth: register, login, JWT issue/validate, role in token or DB.
- Quests: list (for learner: only published/unlocked), get by id (with test cases hidden).
- Execution: run code (sandbox or Pyodide), return stdout/stderr and runtime; timeout handling.
- Submission: submit code for a quest → run tests → record result → update progress and unlock next quest + Knowledge Scroll.
- Progress: get current user’s progress map (completed / current / locked).
- Admin: CRUD quests and test cases; optional user list and basic analytics.

### Phase 4 – Frontend UI
- Public/home and auth (login, register with role).
- Learner: dashboard with progress map (linear path), quest list, quest detail page with code editor and run/submit.
- Display run result and submission feedback; show Knowledge Scroll after success.
- Learner profile/analytics page (quests done, level, streak, XP).
- Admin: dashboard, quest list, create/edit/delete quest and test cases.

### Phase 5 – Authentication & authorization
- Enforce JWT on all protected routes; RBAC (Learner vs Admin).
- Rate limiting on code submission (e.g. 5/minute per user).
- Secure password hashing and input validation everywhere.

### Phase 6 – Hints & polish
- Hint endpoint: either rule-based or LLM (compare learner code vs solution, return gradual hint).
- “Request Hint” button in quest UI; show hint in UI without revealing solution.
- Error handling and “System Busy” messaging for sandbox/API failures.
- Basic tests: unit (validation, progress logic) and integration (auth, submit quest).

---

## 5. Suggested Folder Structure (high level)

```
FinalYear/
├── backend/                    # Python FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── quests.py
│   │   │   ├── execute.py
│   │   │   ├── progress.py
│   │   │   └── admin/
│   │   ├── core/
│   │   │   ├── security.py      # JWT, password hash
│   │   │   ├── sandbox.py      # execution abstraction (Pyodide or Docker)
│   │   │   └── hints.py        # rule-based or LLM
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── db/
│   ├── alembic/
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (learner)/
│   │   │   ├── (admin)/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── editor/
│   │   │   ├── progress-map/
│   │   │   └── ui/
│   │   ├── lib/
│   │   └── hooks/
│   ├── package.json
│   └── .env.local.example
├── docs/                       # API and design notes
└── CODEQUEST_ANALYSIS_AND_PLAN.md  # this file
```

---

## 6. Milestones (checkpoints)

| # | Milestone | Deliverables | Exit condition |
|---|-----------|--------------|-----------------|
| **M1** | Project setup | Repo structure, backend app, frontend app, DB connection, one migration | You can run backend and frontend; DB has tables. |
| **M2** | Database & models | All entities, relationships, seed data (users + quests) | Seed script runs; you can query users and quests. |
| **M3** | Backend APIs | Auth, quests list/get, run code, submit, progress, admin CRUD | Postman/curl can register, login, get quests, submit and get progress. |
| **M4** | Frontend UI | Login/register, learner dashboard + progress map, quest page with editor, run/submit, Knowledge Scroll | Learner can complete a full quest flow in the browser. |
| **M5** | Auth & security | JWT enforcement, RBAC, rate limit, validation | Only authorized roles access admin; submission rate limited. |
| **M6** | Hints & tests | Hint API + “Request Hint” in UI; unit/integration tests | Hints work; critical paths covered by tests. |

---

## 7. Next Step

Decisions (1)–(5) are **locked from the documentation** as in Section 2. We can proceed with **Milestone 1 – Project setup**: create the folder structure, backend (FastAPI + PostgreSQL + SQLAlchemy), frontend (Next.js + Tailwind), and a minimal health check + DB migration. No quest logic or full UI yet—just a solid, documented base to build on.

If you prefer a different order (e.g. database design before backend app skeleton), say so and we’ll adjust.
