# CodeQuest Database Schema (Milestone 2)

Entity summary and indexes. Matches the project documentation (User, Learner, Admin, Quest, TestCase, Submission).

## Entities

| Table | Purpose |
|-------|--------|
| **users** | Identity and auth: username, email, password_hash, role (learner/admin). |
| **learners** | 1:1 with User; current_level, total_points. |
| **admins** | 1:1 with User; admin_status. |
| **quests** | One challenge: title, description, level, order_rank, initial_code, solution_code, explanation. |
| **test_cases** | N:1 with Quest; input_data (JSONB), expected_output, is_hidden. |
| **submissions** | One attempt: learner_id, quest_id, code, passed, output_log, created_at. |
| **learning_paths** | Curated sequence: title, description, level (1–3), order_rank. |
| **learning_path_quests** | Junction: path_id, quest_id, order_rank. |

## Relationships

- **User** → Learner (0..1), Admin (0..1)
- **Learner** → User (1), Submissions (many)
- **Admin** → User (1)
- **Quest** → TestCases (many), Submissions (many)
- **TestCase** → Quest (1)
- **Submission** → Learner (1), Quest (1)
- **LearningPath** → LearningPathQuest (many)
- **LearningPathQuest** → LearningPath (1), Quest (1)

## Indexes

- `users`: unique on username, email
- `learners`: unique on user_id
- `admins`: unique on user_id
- `quests`: unique on order_rank (linear progression)
- `test_cases`: index on quest_id
- `submissions`: (learner_id, quest_id), (learner_id, created_at)

## Progress semantics

- A learner has **completed** a quest if there is at least one **submission** with `passed = true` for that (learner_id, quest_id).
- **Unlock next quest**: next quest in `order_rank` is unlocked when the previous one is completed.
- **Knowledge Scroll**: the quest’s `explanation` is shown after the first passing submission.

## Verifying M2

1. Run migrations: `cd backend && alembic upgrade head`
2. Seed: `python -m scripts.seed`
3. Query (e.g. with `psql` or any SQL client):

```sql
SELECT id, username, email, role FROM users;
SELECT id, title, order_rank FROM quests ORDER BY order_rank;
SELECT quest_id, COUNT(*) FROM test_cases GROUP BY quest_id;
```

Seeded users (for M3 login):

- **Learner:** `learner@codequest.dev` / `learner123`
- **Admin:** `admin@codequest.dev` / `admin123`
