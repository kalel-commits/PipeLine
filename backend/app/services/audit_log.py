from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from datetime import datetime
from typing import Optional

class AuditLogService:
    @staticmethod
    def log_action(
        db: Session, 
        user_id: int, 
        action: str, 
        ip_address: Optional[str] = None, 
        role: Optional[str] = None, 
        status: str = "success"
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            timestamp=datetime.utcnow(),
            role=role,
            status=status
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

audit_log_service = AuditLogService()
