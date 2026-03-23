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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Endpoint for generic VCS Webhooks (e.g., GitLab, GitHub, Bitbucket).
    We process the event in the background to ensure fast response to GitLab (200 OK).
    """
    payload = await request.json()
    
    # Event verification: Support both MR and Push events
    event_name = request.headers.get("X-Gitlab-Event")
    if event_name not in ["Merge Request Hook", "Push Hook"]:
        return {"status": "ignored", "reason": f"Event type {event_name} not supported"}

    # 1. Process the event (Synchronous processing for immediate DB sync)
    try:
        process_vcs_event(db, payload)
        
        from models.vcs_prediction import VCSPrediction
        count = db.query(VCSPrediction).count()
        
        return {"status": "success", "total_captured": count}
    except Exception as e:
        import traceback
        print(f"ERROR processing GitLab MR: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
