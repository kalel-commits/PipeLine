from sqlalchemy.orm import Session
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from db import SessionLocal, engine
from models.base import Base
from models.user import User, UserRole
from utils.security import hash_password

def run_seeding():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("Seeding users...")
            seed_users = [
                User(name="Admin User", email="admin@pipeline.ai", hashed_password=hash_password("Admin123!"), role=UserRole.admin),
                User(name="Dev User", email="dev@pipeline.ai", hashed_password=hash_password("Dev123!"), role=UserRole.developer),
                User(name="Analyst User", email="analyst@pipeline.ai", hashed_password=hash_password("Analyst123!"), role=UserRole.analyst),
            ]
            db.add_all(seed_users)
            db.commit()
            print("Seeding complete.")
        else:
            print(f"Users already exist: {db.query(User).count()}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seeding()
