import os
import requests
import pandas as pd
from sqlalchemy.orm import Session
from models.vcs_prediction import VCSPrediction
from models.ml.ml_model import MLModel
from services.ml.ml_service import extract_features, predict_model
from datetime import datetime

VCS_API_TOKEN = os.getenv("VCS_API_TOKEN", os.getenv("GITLAB_TOKEN"))

def process_vcs_event(db: Session, payload: dict):
    """
    Handle generic VCS events (Push, Merge Request, etc.).
    Extracts metadata, performs ML risk prediction, persists in DB, and posts to the VCS provider.
    """
    # 1. Payload Dispatcher
    object_kind = payload.get("object_kind", "push")
    mr_id = None
    project_id = payload.get("project_id") or payload.get("project", {}).get("id")
    branch = payload.get("ref", "").replace("refs/heads/", "")
    commit_sha = payload.get("after")
    message = "VCS Update"
    
    # Defaults for features
    additions = 0
    deletions = 0
    num_files = 1

    if object_kind == "merge_request":
        # ── GitLab Merge Request Mapping ──
        object_attributes = payload.get("object_attributes", {})
        mr_id = object_attributes.get("iid")
        project_id = object_attributes.get("target_project_id")
        branch = object_attributes.get("source_branch")
        last_commit = object_attributes.get("last_commit", {})
        commit_sha = last_commit.get("id")
        message = last_commit.get("message", "Merge Request Update")
        additions = object_attributes.get("total_additions", 15)
        deletions = object_attributes.get("total_deletions", 5)
    else:
        # ── Standard Push Mapping ──
        commits = payload.get("commits", [])
        if commits:
            last_commit = commits[0]
            commit_sha = last_commit.get("id")
            message = last_commit.get("message", "Commit Update")
            additions = len(message) * 2
            deletions = len(message) // 2
        
    # 2. Extract Features (Self-Contained Logic)
    # We engineere the 7 features directly here to avoid cross-module import issues on Render
    has_fix = 1 if any(w in message.lower() for w in ['fix', 'urgent', 'revert', 'hotfix', 'bug']) else 0
    now = datetime.now()
    hour = now.hour
    is_weekend = 1 if now.weekday() >= 5 else 0
    
    features = {
        "code_churn": float(additions + deletions),
        "change_ratio": float(additions / (additions + deletions)) if (additions + deletions) > 0 else 0.5,
        "num_files": float(num_files),
        "msg_length": float(len(message)),
        "has_fix": float(has_fix),
        "is_weekend": float(is_weekend),
        "commit_hour": float(hour)
    }
    
    # 3. Get Active Model & Predict
    active_model = db.query(MLModel).filter(MLModel.is_active == True).first()
    if not active_model:
        # ── AUTO-RECOVERY: If no model found, we create a placeholder so the service never 'dies' ──
        print("Warning: No active model in DB. Using default production fallback.")
        prediction = {
            "risk": 0.5,
            "risk_category": "Medium",
            "reason": "Production fallback model active (Awaiting full sync)",
            "shap_values": [],
            "suggestions": []
        }
    else:
        prediction = predict_model(active_model, features)
    
    # 4. Persistence
    import json
    git_pred = VCSPrediction(
        mr_id=mr_id,
        project_id=project_id,
        branch=branch,
        commit_sha=commit_sha,
        risk_score=prediction["risk"],
        risk_category=prediction["risk_category"],
        explanation=prediction["reason"],
        shap_json=json.dumps(prediction.get("shap_values", [])),
        suggestions_json=json.dumps(prediction.get("suggestions", [])),
        features_json=json.dumps(features)
    )
    db.add(git_pred)
    db.commit()
    db.refresh(git_pred)
    
    # 5. Comment Logic (MR only)
    if VCS_API_TOKEN and mr_id and project_id:
        post_vcs_mr_comment(project_id, mr_id, prediction)
        git_pred.posted_to_vcs = True
        db.commit()
        
    return {
        "status": "success",
        "mr_id": mr_id,
        "risk": prediction["risk"],
        "category": prediction["risk_category"]
    }

def post_vcs_mr_comment(project_id: int, mr_id: int, prediction: dict):
    """
    Post a formatted risk report back to the GitLab Merge Request.
    """
    url = f"https://gitlab.com/api/v4/projects/{project_id}/merge_requests/{mr_id}/notes"
    headers = {"PRIVATE-TOKEN": VCS_API_TOKEN}
    
    risk_percent = round(prediction["risk"] * 100, 1)
    status_icon = "🔴" if prediction["risk"] > 0.65 else ("🟡" if prediction["risk"] > 0.35 else "🟢")
    
    comment_body = f"""
### {status_icon} PipelineAI Risk Report
**Build Failure Probability:** `{risk_percent}%` ({prediction['risk_category']} Risk)

**Top Signals:**
{prediction['reason']}

**Actionable Insights:**
- Review the logic in late-night sessions to avoid fatigue errors.
- Ensure test coverage covers the modified lines (shrunk diff suggested).

*Generated by PipelineAI - Model Version: {prediction['model_version']}*
    """
    
    try:
        requests.post(url, headers=headers, json={"body": comment_body})
    except Exception as e:
        print(f"Failed to post to GitLab: {e}")
