import os
import requests
from sqlalchemy.orm import Session
from models.vcs_prediction import VCSPrediction
from models.ml.ml_model import MLModel
from services.ml.ml_service import predict_model
from datetime import datetime

VCS_API_TOKEN = os.getenv("VCS_API_TOKEN", os.getenv("GITLAB_TOKEN"))


def _safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _extract_push_stats(commits: list, message: str):
    """Prefer real webhook diff stats; fallback to synthetic only if missing."""
    additions = 0
    deletions = 0
    file_set = set()
    stats_found = False

    for commit in commits or []:
        added_files = commit.get("added", []) or []
        modified_files = commit.get("modified", []) or []
        removed_files = commit.get("removed", []) or []

        if added_files or modified_files or removed_files:
            stats_found = True
            file_set.update(added_files)
            file_set.update(modified_files)
            file_set.update(removed_files)
            additions += len(added_files) + len(modified_files)
            deletions += len(removed_files)

    if stats_found:
        return max(additions, 0), max(deletions, 0), max(len(file_set), 1), "real_diff"

    # Final fallback when providers omit file-level stats
    synthetic_add = max(len(message) // 4, 1)
    synthetic_del = max(len(message) // 10, 0)
    return synthetic_add, synthetic_del, 1, "synthetic_fallback"


def _safe_changes_count(value, default=1):
    """GitLab may send changes_count like '12' or '12+'."""
    if value is None:
        return default
    if isinstance(value, int):
        return max(value, default)
    text = str(value).strip()
    digits = "".join(ch for ch in text if ch.isdigit())
    if digits:
        return max(int(digits), default)
    return default

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
    target_branch = None
    
    # Defaults for features
    additions = 0
    deletions = 0
    num_files = 1
    feature_source = "synthetic_fallback"

    if object_kind == "merge_request":
        # ── GitLab Merge Request Mapping ──
        object_attributes = payload.get("object_attributes", {})
        mr_id = object_attributes.get("iid")
        project_id = object_attributes.get("target_project_id")
        branch = object_attributes.get("source_branch")
        target_branch = object_attributes.get("target_branch")
        last_commit = object_attributes.get("last_commit", {})
        commit_sha = last_commit.get("id")
        message = (
            object_attributes.get("title")
            or last_commit.get("message")
            or payload.get("object_attributes", {}).get("description")
            or "Merge Request Update"
        )
        additions = _safe_int(object_attributes.get("total_additions"), 0)
        deletions = _safe_int(object_attributes.get("total_deletions"), 0)
        num_files = _safe_changes_count(object_attributes.get("changes_count"), 1)
        is_draft = bool(
            object_attributes.get("work_in_progress")
            or object_attributes.get("draft")
            or str(object_attributes.get("title", "")).lower().startswith(("draft:", "wip:"))
        )
        mr_labels = object_attributes.get("labels") or []
        hotfix_label = any("hotfix" in str(lbl).lower() for lbl in mr_labels)
        if is_draft:
            # Draft MRs are typically pre-review and can be noisier
            additions = int(additions * 1.1)
            deletions = int(deletions * 1.1)
        if hotfix_label:
            message = f"{message} hotfix"
        feature_source = "real_diff" if (additions + deletions) > 0 or num_files > 1 else "synthetic_fallback"
    else:
        # ── Standard Push Mapping ──
        commits = payload.get("commits", [])
        if commits:
            last_commit = commits[0]
            commit_sha = last_commit.get("id")
            message = last_commit.get("message", "Commit Update")
            additions, deletions, num_files, feature_source = _extract_push_stats(commits, message)
        else:
            # ── Handle GitLab 'Test' button or Empty Push ──
            commit_sha = payload.get("after") or "test_sha_placeholder"
            message = "GitLab Test Event / Empty Push"
            additions = 6
            deletions = 1
            num_files = 1
            feature_source = "synthetic_fallback"
            print("Processing GitLab Test/Empty Push Event")
        
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
            "risk": 0.12,
            "risk_category": "Low",
            "reason": "Using conservative fallback model until full training sync completes",
            "shap_values": [],
            "suggestions": [],
            "source": "fallback_heuristic",
        }
    else:
        prediction = predict_model(active_model, features)
    
    debug_meta = {
        "event_kind": object_kind,
        "feature_source": feature_source,
        "prediction_source": prediction.get("source", "unknown"),
        "project_id": project_id,
        "branch": branch,
        "target_branch": target_branch,
        "commit_sha": commit_sha,
        "mr_id": mr_id,
        "ingested_at": datetime.utcnow().isoformat(),
    }

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
        features_json=json.dumps({**features, "_meta": debug_meta})
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
        "event_kind": object_kind,
        "mr_id": mr_id,
        "project_id": project_id,
        "branch": branch,
        "target_branch": target_branch,
        "commit_sha": commit_sha,
        "risk": prediction["risk"],
        "category": prediction["risk_category"],
        "source": prediction.get("source", feature_source),
        "feature_source": feature_source,
        "debug": debug_meta,
    }

def post_vcs_mr_comment(project_id: int, mr_id: int, prediction: dict):
    """
    Post a formatted risk report back to the GitLab Merge Request.
    """
    url = f"https://gitlab.com/api/v4/projects/{project_id}/merge_requests/{mr_id}/notes"
    headers = {"PRIVATE-TOKEN": VCS_API_TOKEN}
    
    risk_percent = round(prediction["risk"] * 100, 1)
    status_icon = "🔴" if prediction["risk"] > 0.65 else ("🟡" if prediction["risk"] > 0.35 else "🟢")
    
    suggestions = prediction.get("suggestions", [])
    suggestion_text = ""
    if suggestions:
        suggestion_text = "\n**Actionable Insights:**\n" + "\n".join([f"- {s['icon']} **{s['title']}**: {s['detail']}" for s in suggestions])
    else:
        suggestion_text = "\n**Actionable Insights:**\n- 🟢 No critical risks detected. Maintain current development best practices."

    comment_body = f"""
### {status_icon} PipelineAI Risk Report
**Build Failure Probability:** `{risk_percent}%` ({prediction['risk_category']} Risk)

**Top Signals:**
{prediction['reason']}
{suggestion_text}

*Generated by PipelineAI - Architectural Forecaster Layer*
    """
    
    try:
        requests.post(url, headers=headers, json={"body": comment_body})
    except Exception as e:
        print(f"Failed to post to GitLab: {e}")
