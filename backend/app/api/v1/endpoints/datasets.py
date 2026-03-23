from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.models.dataset import Dataset

router = APIRouter()

@router.get("/list")
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).all()
    # Map 'name' to 'filename' for frontend compatibility
    return {"datasets": [
        {
            "id": d.id,
            "filename": d.name, 
            "status": "processed",
            "row_count": d.row_count
        } for d in datasets
    ]}
