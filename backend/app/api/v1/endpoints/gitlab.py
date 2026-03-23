from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.services.ml import ml_service
from app.services.gitlab import gitlab_service
from app.services.audit_log import audit_log_service
from app.schemas.gitlab import WebhookResponse
from typing import Dict, Any

router = APIRouter()

@router.post("/webhook", response_model=WebhookResponse)
async def gitlab_webhook(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Modular GitLab Webhook handler.
    Process MR events, run ML prediction, and post comments.
    """
    object_kind = payload.get("object_kind")
    if object_kind not in ["merge_request", "push"]:
        return WebhookResponse(status="ignored", reason=f"Ignored kind: {object_kind}")

    # ... logic for MR open/update ...
    project_id = payload.get("project", {}).get("id")
    mr_iid = payload.get("object_attributes", {}).get("iid")
    
    # Run Prediction & Process Heuristics
    ml_service.process_webhook_payload(payload)
    prediction = ml_service.predict_latest()
    
    # Non-critical: Post back to GitLab (wrap in try to ensure auditing)
    try:
        message = gitlab_service.construct_prediction_message(prediction, {})
        gitlab_service.post_mr_comment(project_id, mr_iid, message)
    except Exception as e:
        print(f"GitLab comment error: {e}")
    
    # Critical: Log Action
    audit_log_service.log_action(
        db, user_id=1, 
        action=f"Webhook MR !{mr_iid} predicted", 
        status="success" if prediction.get("risk", 0) < 0.8 else "warning"
    )

    return WebhookResponse(status="success", prediction=prediction)
