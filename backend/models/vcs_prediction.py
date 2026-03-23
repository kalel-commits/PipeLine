from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, func
from models.base import Base

class VCSPrediction(Base):
    __tablename__ = "vcs_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    mr_id = Column(Integer, nullable=False)
    project_id = Column(Integer, nullable=False)
    branch = Column(String(100), nullable=True)
    commit_sha = Column(String(40), nullable=True)
    
    risk_score = Column(Float, nullable=False)
    risk_category = Column(String(20), nullable=True)
    explanation = Column(String(500), nullable=True)
    
    # Rich visualization data (Stored as JSON strings)
    shap_json = Column(String(2000), nullable=True)
    suggestions_json = Column(String(1000), nullable=True)
    features_json = Column(String(1000), nullable=True)
    
    # Track if we successfully posted the comment to GitLab
    posted_to_vcs = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
