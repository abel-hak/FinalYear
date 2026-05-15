"""
Seed script: creates one Learner, one Admin, and comprehensive curriculum quests.
Uses passlib (bcrypt) for password hashing so seeded users work with auth in M3+.

Curriculum includes 78 quests across 6 languages (Python, Java, C++, JavaScript, TypeScript, C)
with 3 progression levels per language (4-5-4 quests per level).

Run from backend dir: python -m scripts.seed
Requires: DATABASE_URL_SYNC or DATABASE_URL set (sync URL used for script).
"""
import os
import sys
import uuid

# Add backend root to path so "app" is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load .env if present
from pathlib import Path
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use sync URL
database_url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get("DATABASE_URL", "").replace(
    "postgresql+asyncpg://", "postgresql+psycopg://", 1
)
if not database_url or database_url == "postgresql+psycopg://user:password@localhost:5432/codequest":
    print("Set DATABASE_URL or DATABASE_URL_SYNC in .env (e.g. postgresql+psycopg://user:pass@localhost:5432/codequest)")
    sys.exit(1)

from app.models.user import User
from app.models.learner import Learner
from app.models.admin import Admin

# Real password hashing so M3 login works with seeded users (use bcrypt directly, same as app)
def _hash_password(password: str) -> str:
    import bcrypt
    pw = password.encode("utf-8")
    if len(pw) > 72:
        pw = pw[:72]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")

engine = create_engine(database_url)
Session = sessionmaker(bind=engine)

def seed():
    session = Session()
    try:
        print("Starting seed process...\n")

        # 1) Learner user (idempotent)
        learner_user = session.query(User).filter(User.email == "learner@codequest.dev").first()
        if learner_user is None:
            print("Creating learner user...")
            learner_user = User(
                id=uuid.uuid4(),
                username="learner1",
                email="learner@codequest.dev",
                password_hash=_hash_password("learner123"),
                role="learner",
            )
            session.add(learner_user)
            session.flush()
        else:
            print("Learner user already exists; skipping user creation.")

        learner = session.query(Learner).filter(Learner.user_id == learner_user.id).first()
        if learner is None:
            session.add(Learner(
                id=uuid.uuid4(),
                user_id=learner_user.id,
                current_level=1,
                total_points=0,
            ))
            print("Created learner profile.")
        else:
            print("Learner profile already exists; skipping profile creation.")

        # 2) Admin user (idempotent)
        admin_user = session.query(User).filter(User.email == "admin@codequest.dev").first()
        if admin_user is None:
            print("Creating admin user...")
            admin_user = User(
                id=uuid.uuid4(),
                username="admin1",
                email="admin@codequest.dev",
                password_hash=_hash_password("admin123"),
                role="admin",
            )
            session.add(admin_user)
            session.flush()
        else:
            print("Admin user already exists; skipping user creation.")

        admin = session.query(Admin).filter(Admin.user_id == admin_user.id).first()
        if admin is None:
            session.add(Admin(
                id=uuid.uuid4(),
                user_id=admin_user.id,
                admin_status="active",
            ))
            print("Created admin profile.")
        else:
            print("Admin profile already exists; skipping profile creation.")

        # 3) Seed comprehensive curriculum for all languages
        print("Seeding comprehensive curriculum...\n")
        from scripts.seed_curriculum import seed_full_curriculum
        seed_full_curriculum(session)

        session.commit()
        print("\n" + "="*60)
        print("✓ SEEDING COMPLETE!")
        print("="*60)
        print("\nUsers created:")
        print("  • Learner: learner@codequest.dev / learner123")
        print("  • Admin:   admin@codequest.dev / admin123")
        print("\nCurriculum seeded:")
        print("  • 78 quests across 6 languages")
        print("  • 18 learning paths (3 levels × 6 languages)")
        print("  • Python, Java, C++, JavaScript, TypeScript, C")
        print("\nQuests per language:")
        print("  • Level 1 (Basic): 4 quests")
        print("  • Level 2 (Intermediate): 5 quests")
        print("  • Level 3 (Advanced): 4 quests")
        print("="*60 + "\n")

    except Exception as e:
        session.rollback()
        print(f"\n✗ Seed failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
