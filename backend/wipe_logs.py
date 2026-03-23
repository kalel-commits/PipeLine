import sys
import os

# Add the current directory (backend) to the sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import SessionLocal
from models.audit_log import AuditLog

def clear_logs():
    db = SessionLocal()
    try:
        num_deleted = db.query(AuditLog).delete()
        db.commit()
        print(f"Successfully deleted {num_deleted} logs from the database.")
        
        # Double check
        count = db.query(AuditLog).count()
        print(f"Current count: {count}")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_logs()
