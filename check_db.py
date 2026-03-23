import sys
import os

# add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.db import SessionLocal
from backend.models.audit_log import AuditLog

db = SessionLocal()
logs = db.query(AuditLog).all()
print(f"Total logic rows: {len(logs)}")
for l in logs:
    print(f"- {l.id} | {l.action} | {l.user_id}")
