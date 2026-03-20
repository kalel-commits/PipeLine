from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from models.base import Base


class PredictionFeedback(Base):
    __tablename__ = "prediction_feedback"
    id = Column(Integer, primary_key=True, index=True)
    prediction_risk = Column(Float, nullable=False)
    prediction_reason = Column(String(500), nullable=True)
    risk_category = Column(String(20), nullable=True)
    actual_outcome = Column(String(20), nullable=False)  # "correct" or "incorrect"
    feedback_note = Column(String(500), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User")
