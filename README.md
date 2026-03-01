# CodeQuest – Debugging-based Learning Platform

Final year project: web platform for learning programming through debugging challenges (quests).  
See [CODEQUEST_ANALYSIS_AND_PLAN.md](./CODEQUEST_ANALYSIS_AND_PLAN.md) for full analysis and milestones.

## Quick start

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **PostgreSQL** 14+

### Backend

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
# Example: postgresql+asyncpg://user:pass@localhost:5432/codequest
#          postgresql://user:pass@localhost:5432/codequest
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/docs  
- Health: http://localhost:8000/health  

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:3000  

## Project structure

```
FinalYear/
├── backend/          # FastAPI, SQLAlchemy, PostgreSQL
├── frontend/        # Next.js 14, Tailwind
├── docs/
├── CODEQUEST_ANALYSIS_AND_PLAN.md
└── README.md
```

## Milestones

| M | Name              | Status   |
|---|-------------------|----------|
| 1 | Project setup     | Done     |
| 2 | Database & models | Done (in M1) |
| 3 | Backend APIs      | Pending  |
| 4 | Frontend UI       | Pending  |
| 5 | Auth & security   | Pending  |
| 6 | Hints & tests     | Pending  |
