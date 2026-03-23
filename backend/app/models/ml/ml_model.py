from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.db.base_class import Base

class MLModel(Base):
    __tablename__ = "ml_models"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    trained_at = Column(DateTime(timezone=True), server_default=func.now())
