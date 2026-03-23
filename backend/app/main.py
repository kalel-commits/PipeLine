from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine
from app.db.base import Base

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS - Modified for production-grade security and frontend compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": f"{settings.PROJECT_NAME} API v2.0 is running."}
