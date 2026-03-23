from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "PipelineAI"
    API_V1_STR: str = "/api/v1"
    
    # Unified database path inside the backend directory
    DATABASE_URL: str = "sqlite:///./db/dev.db"
    
    # GitLab
    GITLAB_TOKEN: str = "your_gitlab_personal_access_token"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
