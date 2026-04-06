from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from db import SessionLocal
from models.user import User, UserRole
from utils.security import validate_password_strength
from utils.jwt_auth import create_access_token, require_role, decode_access_token
from services.user_service import get_user_by_email, create_user, authenticate_user
from services.audit_log_service import log_action
from pydantic import BaseModel, EmailStr
from typing import List

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.developer

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    is_locked: bool
    class Config:
        from_attributes = True

@router.post("/register", response_model=UserResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db), request: Request = None):
    user = create_user(db, req.name, req.email, req.password, req.role)
    log_action(db, user.id, "register", request.client.host if request else None)
    return user

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db), request: Request = None):
    user = get_user_by_email(db, req.email)
    if not user or user.is_locked:
        log_action(db, user.id if user else None, "login_failed", request.client.host if request else None)
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated.")
    if not authenticate_user(db, req.email, req.password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.is_locked = True
        db.commit()
        log_action(db, user.id, "login_failed", request.client.host if request else None)
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    user.failed_login_attempts = 0
    user.is_locked = False
    db.commit()
    access_token = create_access_token({"user_id": user.id, "role": user.role.value})
    log_action(db, user.id, "login_success", request.client.host if request else None)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/profile", response_model=UserResponse)
def get_profile(token_data=Depends(require_role("Developer", "Analyst", "Admin", "Guest")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

class UpdateProfileRequest(BaseModel):
    name: str = None
    password: str = None

@router.put("/profile", response_model=UserResponse)
def update_profile(req: UpdateProfileRequest, token_data=Depends(require_role("Developer", "Analyst", "Admin", "Guest")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if req.name:
        user.name = req.name
    if req.password:
        if not validate_password_strength(req.password):
            raise HTTPException(status_code=400, detail="Password does not meet strength requirements.")
        from utils.security import hash_password
        user.hashed_password = hash_password(req.password)
    db.commit()
    db.refresh(user)
    return user
