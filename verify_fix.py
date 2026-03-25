from sqlalchemy.orm import Session
from backend.db import SessionLocal, engine
from backend.models.user import User, UserRole
from backend.models.base import Base

def verify():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        print(f"Total users: {user_count}")
        users = db.query(User).all()
        for u in users:
            print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Role: {u.role}")
            
        if user_count == 3:
            print("Verification SUCCESS: All default users seeded.")
        else:
            print("Verification FAILED: Expected 3 users.")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
