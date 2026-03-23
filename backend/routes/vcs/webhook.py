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
    
    # Event verification: Ensure it's a Merge Request event
    event_name = request.headers.get("X-Gitlab-Event")
    if event_name != "Merge Request Hook":
        # We only care about MR events for this integration
        return {"status": "ignored", "reason": f"Event type {event_name} not supported"}

    # 1. Process the event (Synchronous for demo reliability)
    try:
        result = process_mr_event(db, payload)
        return {"status": "success", "prediction": result}
    except Exception as e:
        import traceback
        print(f"ERROR processing GitLab MR: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
