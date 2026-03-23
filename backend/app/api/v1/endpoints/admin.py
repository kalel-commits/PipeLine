from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.deps import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.dataset import Dataset
from app.models.ml.ml_model import MLModel

router = APIRouter()

@router.get("/system-stats")
def get_system_stats(db: Session = Depends(get_db)):
    """Retrieve high-level system metrics."""
    return {
        "total_users": db.query(User).count(),
        "active_users": db.query(User).filter(User.is_active == True).count(),
        "total_datasets": db.query(Dataset).count(),
        "total_models": db.query(MLModel).count(),
        "total_predictions": db.query(AuditLog).count()
    }

@router.get("/users")
def get_users(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100)
):
    """Paginated user list."""
    skip = (page - 1) * size
    users = db.query(User).offset(skip).limit(size).all()
    total = db.query(User).count()
    return {"users": users, "total": total}

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100)
):
    """Paginated audit logs."""
    skip = (page - 1) * size
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(size).all()
    total = db.query(AuditLog).count()
    return {"logs": logs, "total": total, "page": page, "size": size}

@router.post("/users/{user_id}/action")
def perform_user_action(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db)
):
    """Admin actions on users."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    action = payload.get("action")
    if action == "activate": user.is_active = True
    elif action == "deactivate": user.is_active = False
    elif action == "delete":
        db.delete(user)
        db.commit()
        return {"status": "deleted"}
    
    db.commit()
    return {"status": "success", "user": user.name, "action": action}
