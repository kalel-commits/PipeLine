from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from db import engine, SessionLocal
from models.base import Base
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Import all models so they register on the shared Base metadata
import models.vcs_prediction
from services.vcs.git_service import process_vcs_event
from services.audit_log_service import log_action
from fastapi import Request, Depends
from sqlalchemy.orm import Session
from db import SessionLocal
from datetime import datetime
import models.ml.ml_model
import models.prediction_feedback
import models.vcs_prediction

from routes.auth.auth_api import router as auth_router
from routes.admin import router as admin_router
from routes.dataset.dataset_api import router as dataset_router
from routes.dataset.feature_extraction_api import router as feature_extraction_router
from routes.dataset.auto_sync_api import router as auto_sync_router
from routes.ml.ml_api import router as ml_router
from routes.feedback_api import router as feedback_router
from routes.vcs.webhook import router as vcs_router
from routes.auth.vcs_auth_api import router as vcs_auth_router

app = FastAPI(title="CI/CD Failure Prediction System API", version="1.0.0")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CORS setup for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all tables on startup using the shared Base
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed the database if it's completely empty (Cloud Deployment Fix)
    from models.user import User, UserRole
    from utils.security import hash_password
    from models.ml.ml_model import MLModel
    import json
    
    db = SessionLocal()
    try:
        # Seed Users
        if db.query(User).count() == 0:
            print("No users found in DB. Auto-seeding default roles...")
            seed_users = [
                User(name="Admin User", email="admin@pipeline.ai", hashed_password=hash_password("Admin123!"), role=UserRole.admin),
                User(name="Dev User", email="dev@pipeline.ai", hashed_password=hash_password("Dev123!"), role=UserRole.developer),
                User(name="Analyst User", email="analyst@pipeline.ai", hashed_password=hash_password("Analyst123!"), role=UserRole.analyst),
            ]
            db.add_all(seed_users)
            db.commit()
            print("Auto-seeding users successful.")

        # Seed ML Models
        active_model = db.query(MLModel).filter(MLModel.is_active == True).first()
        if not active_model:
            print("No active ML model found in DB. Auto-seeding default production model...")
            features = ['code_churn', 'change_ratio', 'num_files', 'msg_length', 'has_fix', 'is_weekend', 'commit_hour']
            metrics = {
                "accuracy": 0.99,
                "feature_names": features,
                "feature_importances": [{"feature": f, "importance": 0.15} for f in features]
            }
            default_model = MLModel(
                dataset_id=1,
                algorithm="random_forest",
                version="2026_LIVE_FIX",
                metrics=metrics,
                model_path="ml/models/model_1_random_forest_2026_LIVE_FIX.joblib",
                trained_by=1,
                is_active=True
            )
            db.add(default_model)
            db.commit()
            print("Auto-seeding model successful.")
    except Exception as e:
        print(f"Error auto-seeding DB: {e}")
    finally:
        db.close()

# Global log buffer for cloud debugging
WEBHOOK_LOGS = []

@app.post("/api/v1/vcs/webhook")
@app.post("/api/v1/gitlab/webhook")
async def root_vcs_webhook(request: Request, db: Session = Depends(get_db)):
    """The ULTIMATE Webhook endpoint that serves both new and legacy URLs."""
    payload = await request.json()
    timestamp = datetime.now().isoformat()
    WEBHOOK_LOGS.append({
        "time": timestamp,
        "kind": payload.get("object_kind", "unknown"),
        "project_id": payload.get("project_id") or payload.get("project", {}).get("id"),
        "event_name": payload.get("event_name"),
    })
    if len(WEBHOOK_LOGS) > 10: WEBHOOK_LOGS.pop(0)

    from services.vcs.git_service import process_vcs_event
    try:
        result = process_vcs_event(db, payload)
        
        # Audit Log: Record the successful webhook event
        log_action(
            db, 
            0, # System/Anonymous for external webhooks
            f"vcs_webhook:{result.get('event_kind') or 'event'}", 
            request.client.host if request else None, 
            "System", 
            "success"
        )

        WEBHOOK_LOGS.append({
            "time": timestamp,
            "processed": True,
            "kind": result.get("event_kind"),
            "mr_id": result.get("mr_id"),
            "branch": result.get("branch"),
            "target_branch": result.get("target_branch"),
            "commit_sha": result.get("commit_sha"),
            "risk": result.get("risk"),
            "category": result.get("category"),
            "source": result.get("source"),
            "feature_source": result.get("feature_source"),
        })
        if len(WEBHOOK_LOGS) > 10: WEBHOOK_LOGS.pop(0)
        return {"status": "success", "source": "ROOT_OVERRIDE_V7", "result": result}
    except Exception as e:
        log_action(db, 0, "vcs_webhook_failed", request.client.host if request else None, "System", "failure")
        WEBHOOK_LOGS.append({"time": timestamp, "error": str(e)})
        if len(WEBHOOK_LOGS) > 10: WEBHOOK_LOGS.pop(0)
        return {"status": "error", "message": str(e)}

@app.get("/logs")
def get_logs():
    return {"logs": WEBHOOK_LOGS}

app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(dataset_router, prefix="/api/v1")
app.include_router(feature_extraction_router, prefix="/api/v1")
app.include_router(auto_sync_router, prefix="/api/v1")
app.include_router(ml_router, prefix="/api/v1")
app.include_router(feedback_router, prefix="/api/v1")
app.include_router(vcs_auth_router, prefix="/api/v1")
# VCS Router removed - Logic now handled by root_vcs_webhook above

@app.get("/api/v1/demo/trigger")
def force_demo_prediction(db: Session = Depends(get_db)):
    """A manual trigger to prove the dashboard is working with rich data."""
    import json
    from models.vcs_prediction import VCSPrediction
    
    # Mock SHAP Data for demo visualization
    # Note: Frontend expects 'shap_value' specifically for toFixed(2)
    mock_shap = [
        {"feature": "Code Churn", "shap_value": 0.452, "value": 850},
        {"feature": "Commit Hour", "shap_value": 0.328, "value": "23:00"},
        {"feature": "File Coupling", "shap_value": 0.220, "value": "12 files"}
    ]
    
    # Mock AI Mentor Suggestions
    mock_suggestions = [
        {"icon": "🌙", "title": "Fatigue Monitoring", "detail": "This late-night commit has high churn. Ensure at least two peer reviews before merging."},
        {"icon": "🧠", "title": "Complexity Alert", "detail": "The diff size is exceptionally large. Consider breaking this into smaller PRs to reduce regression risk."}
    ]

    fake_pred = VCSPrediction(
        mr_id=None,
        project_id=1,
        branch="demo-main",
        commit_sha="demo_" + hex(os.getpid()),
        risk_score=0.92,
        risk_category="High",
        explanation="Simulated High Risk Pattern: High Churn + Late Night Activity.",
        shap_json=json.dumps(mock_shap),
        suggestions_json=json.dumps(mock_suggestions),
        features_json='{"code_churn": 850, "commit_hour": 23, "num_files": 12, "msg_length": 45}'
    )
    db.add(fake_pred)
    db.commit()
    return {"status": "success", "message": "High-risk prediction WITH RICH DATA forced to DB!"}

@app.get("/")
def read_root():
    return {"message": "PipelineAI API Restoration v2.1. Routing Fix Active."}

@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    from models.vcs_prediction import VCSPrediction
    from models.ml.ml_model import MLModel
    pred_count = db.query(VCSPrediction).count()
    model_count = db.query(MLModel).count()
    active_model = db.query(MLModel).filter(MLModel.is_active == True).first()
    return {
        "vcs_predictions_count": pred_count,
        "ml_models_count": model_count,
        "active_model_id": active_model.id if active_model else None,
        "db_timestamp": os.getenv("PORT", "unknown")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
