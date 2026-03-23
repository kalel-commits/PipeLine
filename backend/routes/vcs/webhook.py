from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from db import SessionLocal
from services.vcs.git_service import process_vcs_event

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/webhook")
async def vcs_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Endpoint for generic VCS Webhooks.
    We process everything to be safe.
    """
    payload = await request.json()
    print(f"DEBUG: Webhook received. Kind: {payload.get('object_kind', 'unknown')}")
    
    # Process the event
    try:
        process_vcs_event(db, payload)
        count = db.query(VCSPrediction).count()
        return {"status": "success", "total_captured": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/debug")
def debug_captured_data(db: Session = Depends(get_db)):
    """A public route to verify if data exists in the cloud DB."""
    count = db.query(VCSPrediction).count()
    all_data = db.query(VCSPrediction).all()
    return {
        "count": count,
        "latest_entries": [
            {"id": x.id, "risk": x.risk_score, "branch": x.branch, "mr_id": x.mr_id} 
            for x in all_data
        ]
    }
