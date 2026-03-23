from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, Float, JSON
from app.db.base_class import Base

class PredictionFeedback(Base) :
    __tablename__ = "prediction_feedback"
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(100), index=True)
    is_correct = Column(Boolean, nullable=False)
    user_comment = Column(String(255), nullable=True)
    features_at_time = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
