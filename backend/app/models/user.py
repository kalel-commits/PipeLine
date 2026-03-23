from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

class UserRole(str, enum.Enum):
    developer = "Developer"
    analyst = "Analyst"
    admin = "Admin"
    guest = "Guest"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.developer)
    is_active = Column(Boolean, default=True)
    failed_login_attempts = Column(Integer, default=0)
    is_locked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
