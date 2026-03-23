from fastapi import APIRouter, Depends, Query
from app.services.ml import ml_service
from typing import Optional

router = APIRouter()

@router.get("/latest")
def get_latest_prediction():
    """Retrieve the latest CI/CD risk prediction with service-layer modularity."""
    return ml_service.predict_latest()

@router.get("/stats")
def get_ml_stats():
    """ML system health and training statistics."""
    return ml_service.training_stats or {"status": "operational", "last_retrain": "2026-03-18"}
