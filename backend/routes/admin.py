import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from db import SessionLocal
from models.user import User, UserRole
from models.audit_log import AuditLog
from models.dataset import Dataset, DatasetStatus
from models.ml.ml_model import MLModel, MLAlgorithm
from utils.jwt_auth import require_role
from services.audit_log_service import log_action
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserAdminResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    is_locked: bool
    failed_login_attempts: int
    class Config:
        from_attributes = True

# --- User Management ---

@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    demo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    token_data=Depends(require_role("Admin")),
    request: Request = None 
):
    if demo == "high":
        return {
            "total": 1240,
            "page": page,
            "size": size,
            "users": [
                {"id": 1, "name": "Sarah Jenkins", "email": "s.jenkins@pipeline.ai", "role": "Admin", "is_active": True, "is_locked": False, "failed_login_attempts": 0, "created_at": "2026-01-01"},
                {"id": 2, "name": "Marcus Chen", "email": "m.chen@dev.co", "role": "Developer", "is_active": True, "is_locked": False, "failed_login_attempts": 0, "created_at": "2026-02-15"},
                {"id": 3, "name": "Elena Rodriguez", "email": "elena.r@ops.org", "role": "Analyst", "is_active": True, "is_locked": False, "failed_login_attempts": 0, "created_at": "2026-03-05"},
                {"id": 4, "name": "System Bot", "email": "bot@pipeline.ai", "role": "Developer", "is_active": True, "is_locked": False, "failed_login_attempts": 0, "created_at": "2026-01-10"},
                {"id": 5, "name": "Intruder Alert", "email": "unknown@hacker.io", "role": "Developer", "is_active": False, "is_locked": True, "failed_login_attempts": 5, "created_at": "2026-03-19"}
            ]
        }
    total = db.query(User).count()
    users = db.query(User).offset((page - 1) * size).limit(size).all()
    return {
        "total": total,
        "page": page,
        "size": size,
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "is_locked": u.is_locked,
                "failed_login_attempts": u.failed_login_attempts,
                "created_at": str(u.created_at)
            }
            for u in users
        ]
    }

@router.put("/users/{user_id}/activate")
def activate_user(user_id: int, db: Session = Depends(get_db), token_data=Depends(require_role("Admin")), request: Request = None):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = True
    db.commit()
    log_action(db, token_data.user_id, f"activate_user:{user_id}", request.client.host if request else None, token_data.role)
    return {"detail": "User activated."}

@router.put("/users/{user_id}/deactivate")
def deactivate_user(user_id: int, db: Session = Depends(get_db), token_data=Depends(require_role("Admin")), request: Request = None):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = False
    db.commit()
    log_action(db, token_data.user_id, f"deactivate_user:{user_id}", request.client.host if request else None, token_data.role)
    return {"detail": "User deactivated."}

@router.put("/users/{user_id}/unlock")
def unlock_user(user_id: int, db: Session = Depends(get_db), token_data=Depends(require_role("Admin")), request: Request = None):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_locked = False
    user.failed_login_attempts = 0
    db.commit()
    log_action(db, token_data.user_id, f"unlock_user:{user_id}", request.client.host if request else None, token_data.role)
    return {"detail": "User unlocked."}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), token_data=Depends(require_role("Admin")), request: Request = None):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user)
    db.commit()
    log_action(db, token_data.user_id, f"delete_user:{user_id}", request.client.host if request else None, token_data.role)
    return {"detail": "User deleted."}

# --- Audit Logs ---

@router.get("/audit-logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
    user: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    demo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    token_data=Depends(require_role("Admin")),
    request: Request = None
):
    if demo == "high":
        return {
            "total": 15420,
            "page": page,
            "size": size,
            "logs": [
                {"id": 101, "user_name": "Sarah Jenkins", "role": "Admin", "action": "Retrained Fraud Model v4.2", "status": "success", "ip_address": "192.168.1.45", "timestamp": str(datetime.now())},
                {"id": 102, "user_name": "System", "role": "System", "action": "Auto-scaled cluster: +3 nodes", "status": "success", "ip_address": "internal-vpc", "timestamp": str(datetime.now())},
                {"id": 103, "user_name": "Marcus Chen", "role": "Developer", "action": "Configured Webhook: GitHub Main", "status": "success", "ip_address": "84.21.9.102", "timestamp": str(datetime.now())},
                {"id": 104, "user_name": "System", "role": "System", "action": "Database Backup Completed", "status": "success", "ip_address": "s3-backup-service", "timestamp": str(datetime.now())}
            ]
        }
    query = db.query(AuditLog).outerjoin(User, AuditLog.user_id == User.id)
    if user:
        query = query.filter(User.name.ilike(f"%{user}%"))
    if role:
        query = query.filter(AuditLog.role.ilike(f"%{role}%"))
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if status:
        query = query.filter(AuditLog.status.ilike(f"%{status}%"))
    if start:
        try:
            start_dt = datetime.fromisoformat(start)
            query = query.filter(AuditLog.timestamp >= start_dt)
        except Exception:
            pass
    if end:
        try:
            end_dt = datetime.fromisoformat(end)
            query = query.filter(AuditLog.timestamp <= end_dt)
        except Exception:
            pass
    total = query.count()
    logs = query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * size).limit(size).all()
    return {
        "total": total,
        "page": page,
        "size": size,
        "logs": [
            {
                "id": l.id,
                "user_name": l.user.name if l.user else "System",
                "role": l.role or (l.user.role if l.user else ""),
                "action": l.action,
                "status": l.status or "success",
                "ip_address": l.ip_address,
                "timestamp": str(l.timestamp)
            }
            for l in logs
        ]
    }

@router.get("/audit-logs/export")
def export_audit_logs(
    export: str = Query("csv"),
    user: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    token_data=Depends(require_role("Admin"))
):
    query = db.query(AuditLog).outerjoin(User, AuditLog.user_id == User.id)
    if user:
        query = query.filter(User.name.ilike(f"%{user}%"))
    if role:
        query = query.filter(AuditLog.role.ilike(f"%{role}%"))
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if status:
        query = query.filter(AuditLog.status.ilike(f"%{status}%"))
    if start:
        try:
            query = query.filter(AuditLog.timestamp >= datetime.fromisoformat(start))
        except Exception:
            pass
    if end:
        try:
            query = query.filter(AuditLog.timestamp <= datetime.fromisoformat(end))
        except Exception:
            pass
    logs = query.order_by(AuditLog.timestamp.desc()).all()

    if export == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "User", "Role", "Action", "Status", "IP", "Timestamp"])
        for l in logs:
            writer.writerow([
                l.id,
                l.user.name if l.user else "System",
                l.role or (l.user.role if l.user else ""),
                l.action,
                l.status or "success",
                l.ip_address,
                str(l.timestamp)
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=audit_logs.csv"}
        )
    elif export == "pdf":
        try:
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
            from reportlab.lib.styles import getSampleStyleSheet
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
            styles = getSampleStyleSheet()
            elements = []
            elements.append(Paragraph("Audit Log Report", styles["Title"]))
            data = [["ID", "User", "Role", "Action", "Status", "IP", "Timestamp"]]
            for l in logs:
                data.append([
                    str(l.id),
                    l.user.name if l.user else "System",
                    str(l.role or (l.user.role if l.user else "")),
                    l.action[:50],
                    l.status or "success",
                    l.ip_address or "",
                    str(l.timestamp)[:19]
                ])
            table = Table(data)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1976d2")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
            ]))
            elements.append(table)
            doc.build(elements)
            buffer.seek(0)
            return StreamingResponse(
                buffer,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=audit_logs.pdf"}
            )
        except ImportError:
            raise HTTPException(status_code=500, detail="PDF export requires reportlab to be installed.")
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format. Use 'csv' or 'pdf'.")

# --- System Stats ---

@router.get("/system-stats")
def system_stats(demo: Optional[str] = Query(None), db: Session = Depends(get_db), token_data=Depends(require_role("Admin")), request: Request = None):
    if demo == "high":
        return {
            "total_users": 1240,
            "active_users": 1215,
            "locked_accounts": 3,
            "total_datasets": 45,
            "processed_datasets": 42,
            "total_models": 12,
            "most_used_algorithm": "Random Forest (Best-Fit)",
            "total_predictions": 15420
        }
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    locked_accounts = db.query(User).filter(User.is_locked == True).count()
    total_datasets = db.query(Dataset).count()
    processed_datasets = db.query(Dataset).filter(Dataset.status == DatasetStatus.processed).count()
    total_models = db.query(MLModel).count()

    # Most used algorithm
    algo_counts = db.query(MLModel.algorithm, sqlfunc.count(MLModel.id).label("cnt")).group_by(MLModel.algorithm).order_by(sqlfunc.count(MLModel.id).desc()).first()
    most_used_algorithm = algo_counts[0] if algo_counts else "N/A"

    # Total audit log events as a proxy for total predictions/actions
    total_predictions = db.query(AuditLog).filter(AuditLog.action.like("train_model%")).count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "locked_accounts": locked_accounts,
        "total_datasets": total_datasets,
        "processed_datasets": processed_datasets,
        "total_models": total_models,
        "most_used_algorithm": most_used_algorithm,
        "total_predictions": total_predictions
    }
