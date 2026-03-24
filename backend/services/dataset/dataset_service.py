import os
import pandas as pd
from sqlalchemy.orm import Session
from models.dataset import Dataset, DatasetStatus
from models.user import User
from fastapi import HTTPException
from typing import Tuple
from datetime import datetime

def allowed_file(filename: str) -> bool:
    return filename.lower().endswith(('.csv', '.json'))

def save_file(file, upload_dir: str, filename: str) -> str:
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename).replace("\\", "/")
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    return file_path

def validate_schema(df: pd.DataFrame) -> Tuple[bool, str]:
    required_fields = ["pipeline_status", "execution_time", "commit_id", "files_changed", "lines_added", "lines_removed", "commit_timestamp", "developer_id"]
    for field in required_fields:
        if field not in df.columns:
            return False, f"Missing required field: {field}"
    return True, ""

def create_dataset_record(db: Session, user_id: int, filename: str, file_path: str, record_count: int, status: DatasetStatus) -> Dataset:
    dataset = Dataset(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        upload_timestamp=datetime.utcnow(),
        record_count=record_count,
        status=status
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    # Remove duplicates
    df = df.drop_duplicates()
    # Handle missing values (simple fill or drop)
    df = df.dropna(subset=["pipeline_status", "execution_time", "commit_id", "commit_timestamp", "developer_id"])
    df = df.fillna(0)
    # Normalize timestamps
    df["commit_timestamp"] = pd.to_datetime(df["commit_timestamp"], errors="coerce")
    df = df.dropna(subset=["commit_timestamp"])
    # Encode categorical variables
    # Explicit mapping: Success=0, Failure=1 (Risk)
    if "pipeline_status" in df.columns:
        df["pipeline_status"] = df["pipeline_status"].map({"Success": 0, "Failure": 1}).fillna(0).astype(int)
    
    if "developer_id" in df.columns:
        df["developer_id"] = df["developer_id"].astype("category").cat.codes
    
    return df
