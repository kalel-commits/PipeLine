from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.models.ml.ml_model import MLModel

router = APIRouter()

@router.get("/compare")
def compare_models(dataset_id: int, db: Session = Depends(get_db)):
    models = db.query(MLModel).all() # Simplification for demo
    return {"models": [
        {
            "model_id": m.id,
            "algorithm": m.name,
            "metrics": {
                "accuracy": m.accuracy,
                "f1_score": m.f1_score,
                "precision": m.precision,
                "recall": m.recall,
                "cv": {"f1_mean": m.f1_score, "f1_std": 0.02} # Simulated CV
            }
        } for m in models
    ]}
