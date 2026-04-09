from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, func, Text
from sqlalchemy.orm import relationship
from models.base import Base
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
    audit_logs = relationship("AuditLog", back_populates="user")

    # VCS Integration Fields — persists the OAuth token and hooked repo per user
    vcs_provider = Column(String(20), nullable=True)       # 'github' or 'gitlab'
    vcs_token = Column(Text, nullable=True)                # OAuth access token
    vcs_repo_id = Column(String(50), nullable=True)        # e.g. "123456" (GitHub repo ID)
    vcs_repo_name = Column(String(255), nullable=True)     # e.g. "kalel-commits/PipeLine"
    vcs_webhook_id = Column(String(50), nullable=True)     # ID of the registered webhook
    vcs_github_login = Column(String(100), nullable=True)  # GitHub username for linking
