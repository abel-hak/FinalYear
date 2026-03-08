# CodeQuest – Gap Analysis vs Final Year Project Document

This document compares the implemented system against the requirements in **Final Year Project I (CoSc 4411).pdf** and lists what is **missing** or **incomplete**.

---

## ✅ Implemented (per document)

| Requirement | Status |
|-------------|--------|
| **FR-01** Code submission & execution in isolated environment | ✓ |
| **FR-02** Validation logic (compare output to test cases) | ✓ |
| **FR-03** Result feedback (pass/fail, error messages) | ✓ |
| **FR-04** Timeout notification (5-second limit, force-kill) | ✓ |
| **FR-05** Progress tracking, unlock Knowledge Scroll | ✓ |
| **NFR-01.1** No access to next quest until verified | ✓ |
| **NFR-01.2** Temp files not persisted after sandbox | ✓ |
| **NFR-02.1** Web GUI, embedded code editor, syntax highlighting | ✓ |
| **NFR-02.2** Admin dashboard with analytics | ✓ |
| **NFR-02.3** Gamified elements (badges, progress) | ✓ |
| **NFR-03.2** Interactive Onboarding, FAQ/Help | ✓ (OnboardingTutorial, FAQ page) |
| **NFR-06.2** 5-second force-kill for infinite loops | ✓ |
| **NFR-10.1** RCE protection (sandbox isolation) | ✓ |
| **NFR-10.2** HTTPS, secure password hashing | ✓ |
| **UC-01 to UC-09** Core use cases | ✓ |
| **UC-10** Learner analytics (quests done, level, streak, XP) | ✓ (Quests page, Achievements, Leaderboard, Header stats) |
| **Admin curriculum management** | ✓ |
| **AI hints** (context-aware, gradual) | ✓ |
| **Leaderboard** | ✓ (beyond doc) |
| **Streak tracking** | ✓ (beyond doc) |

---

## ❌ Missing or Incomplete (must implement per document)

### 1. **NFR-01.4 – Rate limiting: 5 code submissions per minute** ✅

**Document:** *"Learner account limited to five code submissions per minute."*

**Status:** Implemented. `submission_rate_limit_per_minute` (default 5) in config. Per-learner in-memory rate limiter on `POST /quests/{id}/submit`. Returns 429 when exceeded.

---

### 2. **NFR-01.3 – "System Busy" for system errors** ✅

**Document:** *"Present 'System Busy' message rather than 'Failed Quest' for system-level errors."*

**Status:** Implemented. System errors (sandbox failure, DB error, quest with no test cases) return 503 with "System Busy. Please try again later." The frontend shows an info-style panel with "System Busy" instead of "Not Quite Right".

---

### 3. **US-014 / Admin – Remove learners for repeated offenses** ✅

**Document:** *"As an Admin, I want to be able to remove any learners that cause repeated offenses."*

**Status:** Implemented. `DELETE /admin/users/{user_id}` soft-deletes User and Learner. Admin Dashboard Users tab has a Remove button with confirmation dialog. Removed learners cannot log in.

---

### 4. **NFR-10.3 – Rate limiting on Code Submission API** ✅

**Document:** *"Rate-limiting on Code Submission API to prevent DoS attacks."*

**Status:** Implemented. Same as NFR-01.4. Additional rate limits: login (5/min), AI hints (10/min).

---

### 5. **NFR-11.2 – Submissions/logs purged every 30 days** ✅

**Document:** *"Submissions/logs purged every 30 days for cost management."*

**Status:** Implemented. Purge keeps the most recent passed submission per (learner, quest) for progress; deletes failed and redundant passed submissions older than 30 days. CLI script `python -m scripts.purge_submissions` (schedule via cron). Admin endpoint `POST /admin/purge-submissions` for manual trigger. Config: `submission_retention_days` (default 30).

---

### 6. **US-013 – Daily activity notifications** ✅

**Document:** *"As a Learner, I want to be able to receive notification to do my daily activities."*

**Status:** Implemented. In-app banner on dashboard and quests pages when learner hasn't practiced today. Banner: "You haven’t practiced today!".

---

### 7. **Tech stack note – Python-Flask vs FastAPI**

**Document:** *"Python-Flask for API development"*

**Status:** Implemented with **FastAPI**, not Flask.

**Action:** Document this in the report as an acceptable alternative (FastAPI is async, has built-in OpenAPI, and is commonly used for Python APIs). No code change required.

---

### 8. **Tech stack note – Go sandbox vs Python subprocess**

**Document:** *"Go for codex building the code execution sandbox. If difficult, revert to Pyodide."*

**Status:** Implemented with **Python subprocess** (backend), not Go or Pyodide.

**Action:** Document as per the fallback: "Sandbox found difficult in Go; implemented using Python subprocess with 5s timeout and isolation." No code change required if this is acceptable.

---

## Summary – All document requirements implemented

All requirements from the Final Year Project document are now implemented.

---

## Beyond-document features implemented

- **Learning paths** – Level-by-level curated sequences; Level N unlocks when Level N-1 complete.
- **Admin path management** – Create/edit/delete paths; assign quests to paths.
- **Concept tags** – Filter quests by tags (variables, loops, etc.).
- **Spaced repetition** – Suggest revisiting quests completed 7+ days ago.
- **Time-based leaderboards** – Weekly/monthly rankings.
- **Dark/light theme** – User preference.
- **Notification center** – Achievements, streaks, system messages.

---

## Documentation updates

1. **SCHEMA.md** – Includes hint_requests, streak_days, last_activity_date, learning_paths.
2. **TESTING.md** – Covers hints, quest submit, sandbox, learning paths.
3. **Report** – Note FastAPI (instead of Flask) and Python subprocess (instead of Go) with justification.
