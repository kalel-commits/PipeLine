from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from db import SessionLocal
from utils.jwt_auth import require_role
from models.dataset import Dataset
from models.ml.ml_model import MLModel, MLAlgorithm
from services.ml.ml_service import train_model, evaluate_model, predict_model, compare_models
from services.audit_log_service import log_action
from typing import Dict, Any

router = APIRouter(prefix="/models", tags=["ml"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/train")
def train(
    dataset_id: int,
    token_data=Depends(require_role("Developer", "Analyst", "Admin")),
    db: Session = Depends(get_db),
    request: Request = None
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    try:
        ml_models = train_model(db, dataset, token_data.user_id, request.client.host if request else None)
        log_action(db, token_data.user_id, f"train_models_multi:{dataset_id}", request.client.host if request else None, token_data.role, "success")
        return {
            "models": [
                {"model_id": m.id, "metrics": m.metrics, "algorithm": m.algorithm, "version": m.version, "is_active": m.is_active}
                for m in ml_models
            ]
        }
    except Exception as e:
        log_action(db, token_data.user_id, f"train_failed:{dataset_id}", request.client.host if request else None, token_data.role, "failure")
        raise HTTPException(status_code=400, detail=f"Training failed: {str(e)}")

@router.post("/{model_id}/set_active")
def set_active(model_id: int, token_data=Depends(require_role("Developer", "Analyst", "Admin")), db: Session = Depends(get_db)):
    ml_model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not ml_model:
        raise HTTPException(status_code=404, detail="Model not found.")
    
    db.query(MLModel).filter(MLModel.dataset_id == ml_model.dataset_id).update({MLModel.is_active: False}, synchronize_session=False)
    ml_model.is_active = True
    db.commit()
    log_action(db, token_data.user_id, f"set_active_model:{model_id}", None, token_data.role, "success")
    return {"status": "success", "active_model_id": ml_model.id, "algorithm": ml_model.algorithm}

@router.get("/{model_id}/evaluate")
def evaluate(model_id: int, token_data=Depends(require_role("Developer", "Analyst", "Admin")), db: Session = Depends(get_db)):
    ml_model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not ml_model:
        raise HTTPException(status_code=404, detail="Model not found.")
    try:
        metrics = evaluate_model(db, ml_model)
        log_action(db, token_data.user_id, f"evaluate_model:{model_id}", None, token_data.role, "success")
        return {"model_id": ml_model.id, "metrics": metrics}
    except Exception as e:
        log_action(db, token_data.user_id, f"evaluate_failed:{model_id}", None, token_data.role, "failure")
        raise HTTPException(status_code=400, detail=f"Evaluation failed: {str(e)}")

@router.post("/{model_id}/predict")
def predict(model_id: int, input_data: Dict[str, Any], token_data=Depends(require_role("Developer", "Analyst", "Admin")), db: Session = Depends(get_db)):
    ml_model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not ml_model:
        raise HTTPException(status_code=404, detail="Model not found.")
    try:
        result = predict_model(ml_model, input_data)
        log_action(db, token_data.user_id, f"manual_predict:{model_id}", None, token_data.role, "success")
        return result
    except Exception as e:
        log_action(db, token_data.user_id, f"manual_predict_failed:{model_id}", None, token_data.role, "failure")
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")

@router.get("/compare")
def compare(dataset_id: int, token_data=Depends(require_role("Developer", "Analyst", "Admin")), db: Session = Depends(get_db)):
    models = compare_models(db, dataset_id)
    return {"models": models}

@router.get("/list")
def list_models(token_data=Depends(require_role("Developer", "Analyst", "Admin")), db: Session = Depends(get_db)):
    models = db.query(MLModel).filter(MLModel.trained_by == token_data.user_id).all()
    models = sorted(models, key=lambda m: m.created_at)
    return {"models": [
        {
            "model_id": m.id,
            "dataset_id": m.dataset_id,
            "algorithm": m.algorithm,
            "version": m.version,
            "is_active": m.is_active,
            "metrics": m.metrics,
            "created_at": str(m.created_at)
        }
        for m in models
    ]}
