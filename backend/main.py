from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import engine
from models.base import Base
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Import all models so they register on the shared Base metadata
import models.user
import models.audit_log
import models.dataset
import models.ml.ml_model
import models.prediction_feedback
import models.gitlab_prediction

from routes.auth import router as auth_router
from routes.admin import router as admin_router
from routes.dataset.dataset_api import router as dataset_router
from routes.dataset.feature_extraction_api import router as feature_extraction_router
from routes.dataset.auto_sync_api import router as auto_sync_router
from routes.ml.ml_api import router as ml_router
from routes.feedback_api import router as feedback_router
from routes.gitlab.gitlab_webhook import router as gitlab_router

app = FastAPI(title="CI/CD Failure Prediction System API", version="1.0.0")

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

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(dataset_router)
app.include_router(feature_extraction_router)
app.include_router(auto_sync_router)
app.include_router(ml_router)
app.include_router(feedback_router)
app.include_router(gitlab_router, prefix="/api/v1/gitlab", tags=["GitLab"])

@app.get("/")
def root():
    return {"message": "CI/CD Failure Prediction System API is running."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
