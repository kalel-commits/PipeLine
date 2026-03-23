from sqlalchemy import Column, Integer, String, DateTime, func
from app.db.base_class import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    action = Column(String(255), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(50), nullable=True)
    role = Column(String(50), nullable=True)
    status = Column(String(50), default="success")
