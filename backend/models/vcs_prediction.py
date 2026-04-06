from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, func
from models.base import Base

class VCSPrediction(Base):
    __tablename__ = "vcs_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True) # Linked to authenticated user
    mr_id = Column(Integer, nullable=True)
    project_id = Column(Integer, nullable=True)
    branch = Column(String(100), nullable=True)
    commit_sha = Column(String(40), nullable=True)
    
    risk_score = Column(Float, nullable=False)
    risk_category = Column(String(20), nullable=True)
    explanation = Column(String(500), nullable=True)
    
    # Rich visualization data (Stored as JSON strings)
    shap_json = Column(String(2000), nullable=True)
    suggestions_json = Column(String(1000), nullable=True)
    features_json = Column(String(1000), nullable=True)
    
    # Metadata for Unification
    source = Column(String(30), default="webhook") # 'webhook' or 'extension'
    is_latest = Column(Boolean, default=False, index=True)
    posted_to_vcs = Column(Boolean, default=False)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
