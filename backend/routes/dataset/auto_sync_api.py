from fastapi import APIRouter, BackgroundTasks, Body, Query, Depends
import os
from typing import List, Any, Optional
import pandas as pd
import numpy as np
import json
import anthropic
from datetime import datetime
from collections import deque
from sqlalchemy.orm import Session
from db import SessionLocal
from models.ml.ml_model import MLModel
from models.vcs_prediction import VCSPrediction
from services.ml.ml_service import predict_model
from services.audit_log_service import log_action

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Resolve path for persistence (Mirroring db.py)
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DB_PATH = os.path.join(_BASE_DIR, "db")
os.makedirs(_DB_PATH, exist_ok=True)

MODEL_PATH = os.path.join(_DB_PATH, "model.pkl")
STATS_PATH = os.path.join(_DB_PATH, "training_stats.json")

# ──────────────────────────────────────────────────────────────────
# In-memory state
# ──────────────────────────────────────────────────────────────────
latest_commit_data = None
training_stats = None
all_commits_history: list = []  # cumulative history for repo insights
model_version_counter = 0
last_trained_at = None

# Training status tracking
training_status = {
    "status": "idle",   # idle | queued | training | done | error
    "started_at": None,
    "completed_at": None,
    "error": None,
    "model_version": 0,
}

def parse_weekend(date_str: str) -> int:
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return 1 if dt.weekday() >= 5 else 0
    except:
        return 0

def parse_hour(date_str: str) -> int:
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.hour
    except:
        return 12

# Drift monitoring – rolling window
prediction_window: deque = deque(maxlen=50)
DRIFT_THRESHOLD = 0.15  # mean risk shift that triggers drift alert

FEATURE_NAMES = [
    'code_churn', 'change_ratio', 'num_files',
    'msg_length', 'has_fix', 'is_weekend', 'commit_hour'
]


# ──────────────────────────────────────────────────────────────────
# Utility helpers
# ──────────────────────────────────────────────────────────────────
def parse_hour(x):
    """Extract hour from git date string."""
    try:
        return datetime.strptime(x, "%a %b %d %H:%M:%S %Y %z").hour
    except Exception:
        try:
            return datetime.strptime(x, "%a %b %d %H:%M:%S %Y").hour
        except Exception:
            return 12


def parse_weekend(x):
    """Check if commit was on a weekend."""
    try:
        return int(datetime.strptime(x, "%a %b %d %H:%M:%S %Y %z").weekday() >= 5)
    except Exception:
        try:
            return int(datetime.strptime(x, "%a %b %d %H:%M:%S %Y").weekday() >= 5)
        except Exception:
            return 0


# Initialize Anthropic Client (reads from ANTHROPIC_API_KEY env var)
client = None
try:
    if os.getenv("ANTHROPIC_API_KEY"):
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
except Exception as e:
    print(f"Anthropic SDK init error: {e}")

def categorize_risk(risk: float) -> str:
    """Classify a probability into Low / Medium / High."""
    if risk < 0.35:
        return "Low"
    if risk < 0.65:
        return "Medium"
    return "High"


def generate_suggestions(vals, risk):
    """
    AI Mentor: Generates real-time refactoring advice.
    Attempts to use Anthropic Claude if an API key is present.
    Falls back to logic-based simulation for local dev.
    """
    # ── Attempt Real Anthropic Call ──
    if client:
        try:
            prompt = f"""
            As an elite DevOps AI (Claude), analyze this CI/CD risk profile:
            - Risk Score: {risk*100:.1f}%
            - Code Churn: {vals[0]} lines
            - Files Changed: {vals[2]}
            - Message Length: {vals[3]} chars
            - Commit Hour: {vals[6]} (24h)
            
            Provide 2-3 specific, actionable suggestions to mitigate this risk. 
            Format as a JSON list of objects: {{"icon": "emoji", "title": "short title", "detail": "explanation"}}
            """
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )
            # Find the JSON part and return it
            import re
            json_match = re.search(r'\[.*\]', response.content[0].text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            print(f"Anthropic Inference Error: {e}")

    # ── High-Fidelity Logic Fallback (if no API Key) ──
    suggestions = []
    if vals[0] > 150:
        suggestions.append({
            "icon": "🧠",
            "title": "Anthropic Claude Insight",
            "detail": f"This commit has a high change density ({int(vals[0])} lines). Large diffs are 3x more likely to harbor regressions. Consider breaking this into smaller, atomic pull requests."
        })
    if vals[6] >= 22 or vals[6] <= 4:
        suggestions.append({
            "icon": "🌙",
        })
    if risk < 0.3 and not suggestions:
        suggestions.append({
            "icon": "✅",
            "title": "Great commit hygiene!",
            "detail": "All signals look healthy. Keep up the disciplined workflow!",
        })
    return suggestions


def extract_features(df):
    """Extract 7 engineered features from raw commit data."""
    df['code_churn'] = df['added'] + df['removed']
    df['change_ratio'] = np.where(
        df['code_churn'] > 0,
        df['added'] / df['code_churn'],
        0.5
    )
    df['num_files'] = df.get('files_changed', pd.Series([1] * len(df)))
    df['msg_length'] = df['message'].astype(str).apply(len)
    df['has_fix'] = df['message'].astype(str).str.contains(
        'fix|urgent|revert|hotfix|bug|broken|crash', case=False, na=False
    ).astype(int)
    df['is_weekend'] = df['date'].apply(parse_weekend)
    df['commit_hour'] = df['date'].apply(parse_hour)
    return df[FEATURE_NAMES].astype(float)


# ──────────────────────────────────────────────────────────────────
# Training
# ──────────────────────────────────────────────────────────────────
def train_model(data):
    """Train a RandomForest on historical commits with cross-validation."""
    global latest_commit_data, training_stats, training_status, all_commits_history, model_version_counter, last_trained_at

    training_status["status"] = "training"
    training_status["started_at"] = datetime.utcnow().isoformat()
    training_status["error"] = None

    try:
        df = pd.DataFrame(data)
        if len(df) == 0:
            training_status["status"] = "error"
            training_status["error"] = "No data received"
            return

        latest_commit_data = df.iloc[0].to_dict()
        all_commits_history.extend(data)  # accumulate for repo insights

        # Simulate failures
        df['failure'] = (
            ((df['added'] + df['removed']) > 150) |
            (df['message'].astype(str).str.contains('fix|urgent|revert', case=False, na=False) &
             df['date'].apply(lambda x: parse_weekend(x) == 1))
        ).astype(int)

        X = extract_features(df)
        y = df['failure']

        if len(y.unique()) <= 1:
            X.loc[len(X)] = [500, 0.9, 8, 3, 1, 1, 23]
            y.loc[len(y)] = 1
            X.loc[len(X)] = [10, 0.5, 1, 50, 0, 0, 10]
            y.loc[len(y)] = 0

        model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
        model.fit(X, y)

        cv_scores = {}
        if len(df) >= 10:
            folds = min(5, len(df))
            scores = cross_val_score(model, X, y, cv=folds, scoring='accuracy')
            cv_scores = {
                "cv_accuracy_mean": round(float(scores.mean()), 4),
                "cv_accuracy_std": round(float(scores.std()), 4),
                "folds": folds,
            }

        importances = dict(zip(FEATURE_NAMES, [round(float(x), 4) for x in model.feature_importances_]))

        model_version_counter += 1
        last_trained_at = datetime.utcnow().isoformat()

        training_stats = {
            "total_commits": len(df),
            "failure_rate": round(float(y.mean()), 4),
            "features_used": FEATURE_NAMES,
            "feature_importances": importances,
            "cross_validation": cv_scores,
            "model_type": "RandomForestClassifier",
            "n_estimators": 100,
            "max_depth": 5,
            "training_baseline_risk": round(float(y.mean()), 4),
            "model_version": model_version_counter,
            "last_trained_at": last_trained_at,
        }

        pickle.dump(model, open(MODEL_PATH, "wb"))
        with open(STATS_PATH, "w") as f:
            json.dump(training_stats, f)

        training_status["status"] = "done"
        training_status["completed_at"] = last_trained_at
        training_status["model_version"] = model_version_counter

    except Exception as e:
        training_status["status"] = "error"
        training_status["error"] = str(e)
        print("Training error:", e)


# ──────────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────────
@router.post("/dataset/auto-sync")
async def auto_sync(background_tasks: BackgroundTasks, data: List[Any] = Body(...), db: Session = Depends(get_db)):
    print(f"Received auto-sync payload: {data}")  # Debug: log incoming webhook payload
    
    # ── PERSIST LATEST TO DB (NEW UNIFIED LOGIC) ──
    if data and isinstance(data, list):
        try:
            latest = data[0]
            # Calculate prediction logic (mirroring git_service.py)
            added = int(latest.get('added', 0))
            removed = int(latest.get('removed', 0))
            churn = added + removed
            num_files = int(latest.get('files_changed', 1))
            message = latest.get('message', 'IDE Sync')
            
            features = {
                "code_churn": float(churn),
                "change_ratio": float(added / churn) if churn > 0 else 0.5,
                "num_files": float(num_files),
                "msg_length": float(len(message)),
                "has_fix": 1.0 if any(w in message.lower() for w in ['fix', 'urgent', 'bug']) else 0.0,
                "is_weekend": float(parse_weekend(latest.get('date', ''))),
                "commit_hour": float(parse_hour(latest.get('date', '')))
            }
            
            # Get active model & predict
            active_model = db.query(MLModel).filter(MLModel.is_active == True).first()
            prediction = predict_model(active_model, features)
            risk = prediction["risk"]

            # Generate rich AI Mentor suggestions
            suggestions = generate_suggestions(features, risk)

            # Build SHAP-like heuristic values for the frontend chart
            churn_val = features["code_churn"]
            shap_values = [
                {"feature": "code_churn",    "value": churn_val,              "shap_value": round(min(churn_val / 600.0, 0.55) if risk > 0.5 else -0.1, 4)},
                {"feature": "has_fix",       "value": features["has_fix"],     "shap_value": round(0.25 if features["has_fix"] else -0.05, 4)},
                {"feature": "num_files",     "value": features["num_files"],   "shap_value": round(0.15 if features["num_files"] > 3 else -0.03, 4)},
                {"feature": "change_ratio",  "value": features["change_ratio"],"shap_value": round((features["change_ratio"] - 0.5) * 0.3, 4)},
                {"feature": "commit_hour",   "value": features["commit_hour"], "shap_value": round(0.2 if features["commit_hour"] >= 22 or features["commit_hour"] <= 4 else -0.02, 4)},
                {"feature": "is_weekend",    "value": features["is_weekend"],  "shap_value": round(0.1 if features["is_weekend"] else -0.02, 4)},
                {"feature": "msg_length",    "value": features["msg_length"],  "shap_value": round(-0.05 if features["msg_length"] > 20 else 0.05, 4)},
            ]
            shap_values.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

            # Clear old "is_latest" for this system (mock user 0 for now)
            db.query(VCSPrediction).filter(VCSPrediction.user_id == 0, VCSPrediction.is_latest == True).update({"is_latest": False})
            
            # Save new prediction
            new_git_pred = VCSPrediction(
                user_id=0,
                commit_sha=latest.get('hash'),
                risk_score=risk,
                risk_category=prediction["risk_category"],
                explanation=prediction["reason"],
                shap_json=json.dumps(shap_values),
                suggestions_json=json.dumps(suggestions),
                features_json=json.dumps({**features, "_meta": {"source": "extension"}}),
                source="extension",
                is_latest=True
            )
            db.add(new_git_pred)
            db.commit()
        except Exception as e:
            print(f"Failed to persist IDE sync to DB: {e}")

    training_status["status"] = "queued"
    background_tasks.add_task(train_model, data)
    return {"status": "Training started and prediction persisted"}


@router.get("/training/status")
def get_training_status():
    """Return real-time training status."""
    return training_status


@router.get("/predict/latest")
def predict_latest(demo: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Predict risk for the latest activity using the active ML model.
    Pulls from VCSPrediction DB (Unified: GitLab/GitHub/IDE Extension).
    """
    # 1. Demo Mode Override
    if demo in ["high", "low"]:
        from services.ml.ml_service import generate_synthetic_features, predict_model
        active_model = db.query(MLModel).filter(MLModel.is_active == True).first()
        features = generate_synthetic_features(demo)
        return predict_model(active_model, features)

    # 2. Unified Prediction Retrieval (DB centric)
    # Order by is_latest and timestamp to get absolute latest record
    latest_git = db.query(VCSPrediction).order_by(VCSPrediction.is_latest.desc(), VCSPrediction.timestamp.desc()).first()
    
    if latest_git:
        import json
        def safe_parse(val, default):
            try:
                return json.loads(val) if val else default
            except Exception:
                return default

        return {
            "risk": latest_git.risk_score,
            "risk_category": latest_git.risk_category,
            "confidence": 0.85,
            "reason": latest_git.explanation,
            "top_insight": latest_git.risk_category + " Risk Detected",
            "shap_values": safe_parse(latest_git.shap_json, []),
            "suggestions": safe_parse(latest_git.suggestions_json, []),
            "features": safe_parse(latest_git.features_json, {}),
            "demo_mode": False,
            "source": latest_git.source,
            "id": latest_git.id,
            "timestamp": latest_git.timestamp.isoformat() if latest_git.timestamp else None,
            "commit_sha": latest_git.commit_sha
        }
            
    # 3. Ultimate Fallback (Empty State)
    return {
        "risk": 0.0,
        "risk_category": "None",
        "confidence": 1.0,
        "reason": "Awaiting activity for analysis",
        "top_insight": "System Idle",
        "demo_mode": False,
        "source": "empty_state",
    }

    # ── Normal prediction ──
    try:
        loaded_model = pickle.load(open(MODEL_PATH, "rb"))

        if latest_commit_data:
            commit = latest_commit_data
            added = int(commit.get('added', 0))
            removed = int(commit.get('removed', 0))
            churn = added + removed
            sample_vals = [
                churn,
                added / churn if churn > 0 else 0.5,
                int(commit.get('files_changed', 1)),
                len(str(commit.get('message', ''))),
                1 if any(w in str(commit.get('message', '')).lower() for w in ['fix', 'urgent', 'revert', 'hotfix', 'bug']) else 0,
                parse_weekend(str(commit.get('date', ''))),
                parse_hour(str(commit.get('date', ''))),
            ]
            return _build_prediction_response(sample_vals)
        else:
            # Explicit Empty State: 0% risk when no commits exist
            return {
                "risk": 0.0,
                "risk_category": "None",
                "confidence": 1.0,
                "reason": "Awaiting first commit for real-time analysis",
                "top_insight": "System Idle",
                "features": {f: 0 for f in FEATURE_NAMES},
                "suggestions": [
                    {"icon": "⏳", "title": "Waiting for Data", "detail": "The AI Mentor is ready. Once you push or save your first commit, real-time risk analysis will appear here."}
                ],
                "shap_values": [],
                "demo_mode": False
            }

    except Exception as e:
        print("Model prediction error:", e)
        return {"risk": 0, "reason": "Model not ready", "risk_category": "Low"}


def _build_prediction_response(vals, is_demo=False):
    """Core prediction logic shared by normal + demo modes."""
    try:
        loaded_model = pickle.load(open(MODEL_PATH, "rb"))
    except Exception:
        return {"risk": 0, "reason": "Model not ready", "risk_category": "Low"}

    sample = [vals]
    prob = loaded_model.predict_proba(sample)[0]
    risk = float(prob[1]) if len(prob) > 1 else float(prob[0])

    category = categorize_risk(risk)

    # ── Dynamic explanation ──
    reasons = []
    if vals[0] > 150:
        reasons.append(f"High code churn ({int(vals[0])} lines changed)")
    if vals[4] == 1:
        reasons.append("Commit message contains risk keywords (fix/urgent/revert)")
    if vals[5] == 1:
        reasons.append("Committed on a weekend")
    if vals[6] >= 22 or vals[6] <= 4:
        reasons.append(f"Late night commit (hour {int(vals[6])})")
    if vals[3] < 10:
        reasons.append("Very short commit message (potential low effort)")
    if vals[2] > 5:
        reasons.append(f"Many files changed ({int(vals[2])} files)")
    if not reasons:
        reasons.append("All signals within normal range")
    reason = " · ".join(reasons)

    # ── SHAP explainability ──
    shap_values_list = []
    try:
        import shap
        explainer = shap.TreeExplainer(loaded_model)
        sv = explainer.shap_values(np.array(sample))
        # For binary classification, shap_values returns [class0, class1]
        if isinstance(sv, list) and len(sv) == 2:
            shap_vals = sv[1][0]
        else:
            shap_vals = sv[0]
        for fname, fval, shapval in zip(FEATURE_NAMES, vals, shap_vals):
            shap_values_list.append({
                "feature": fname,
                "value": round(float(fval), 3),
                "shap_value": round(float(shapval), 4),
            })
        shap_values_list.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    except Exception as e:
        print("SHAP calculation skipped:", e)

    # ── AI Mentor suggestions ──
    suggestions = generate_suggestions(vals, risk)

    # ── Drift tracking ──
    if not is_demo:
        prediction_window.append(risk)

    # ── Confidence score (distance from 0.5 boundary) ──
    confidence = round(abs(risk - 0.5) * 2, 3)  # 0.0 = uncertain, 1.0 = very confident

    # ── Top insight (single most important reason) ──
    top_insight = reasons[0] if reasons else "All signals healthy"

    response = {
        "risk": risk,
        "risk_category": category,
        "confidence": confidence,
        "reason": reason,
        "top_insight": top_insight,
        "features": dict(zip(FEATURE_NAMES, vals)),
        "suggestions": suggestions,
        "shap_values": shap_values_list,
        "model_version": model_version_counter,
        "last_trained_at": last_trained_at,
    }
    if is_demo:
        response["demo_mode"] = True

    return response


@router.get("/training/stats")
def get_training_stats():
    """Return training metrics and feature importances for the dashboard."""
    try:
        with open(STATS_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {"error": "No training stats available yet"}


# ──────────────────────────────────────────────────────────────────
# Drift monitoring
# ──────────────────────────────────────────────────────────────────
@router.get("/drift/status")
def drift_status():
    """
    Return model drift metrics based on rolling prediction window.
    Compares recent mean risk to the training baseline failure rate.
    """
    if len(prediction_window) < 5:
        return {
            "status": "insufficient_data",
            "total_predictions": len(prediction_window),
            "message": "Need at least 5 predictions to assess drift.",
        }

    window_list = list(prediction_window)
    mean_risk = float(np.mean(window_list))
    std_risk = float(np.std(window_list))

    # Compare to training baseline
    baseline = 0.5
    if training_stats and "training_baseline_risk" in training_stats:
        baseline = training_stats["training_baseline_risk"]

    drift_magnitude = abs(mean_risk - baseline)
    drift_detected = drift_magnitude > DRIFT_THRESHOLD

    return {
        "status": "drift_detected" if drift_detected else "stable",
        "mean_risk": round(mean_risk, 4),
        "std_risk": round(std_risk, 4),
        "baseline_risk": round(baseline, 4),
        "drift_magnitude": round(drift_magnitude, 4),
        "drift_threshold": DRIFT_THRESHOLD,
        "total_predictions": len(window_list),
        "should_retrain": drift_detected,
    }


@router.post("/drift/auto-retrain")
async def auto_retrain(background_tasks: BackgroundTasks):
    """Trigger automatic retraining using accumulated commit history."""
    if not all_commits_history:
        return {"status": "error", "message": "No historical commit data available for retraining."}

    background_tasks.add_task(train_model, all_commits_history)
    return {"status": "Retraining triggered", "commits_used": len(all_commits_history)}


# ──────────────────────────────────────────────────────────────────
# Repository insights
# ──────────────────────────────────────────────────────────────────
@router.get("/repo/insights")
def repo_insights():
    """
    Team-level intelligence: failure-prone patterns, risky hours, behavioral stats.
    """
    if not all_commits_history:
        return {"status": "no_data", "message": "No commit history available yet."}

    df = pd.DataFrame(all_commits_history)
    total = len(df)

    # Simulate failure labels (same logic as training)
    df['failure'] = (
        ((df['added'] + df['removed']) > 150) |
        (df['message'].astype(str).str.contains('fix|urgent|revert', case=False, na=False) &
         df['date'].apply(lambda x: parse_weekend(x) == 1))
    ).astype(int)

    failure_count = int(df['failure'].sum())

    # Risky hours analysis
    df['hour'] = df['date'].apply(parse_hour)
    hour_risk = df.groupby('hour')['failure'].mean().to_dict()
    riskiest_hours = sorted(hour_risk.items(), key=lambda x: x[1], reverse=True)[:3]

    # Weekend vs weekday failure rates
    df['is_weekend'] = df['date'].apply(parse_weekend)
    weekend_rate = float(df[df['is_weekend'] == 1]['failure'].mean()) if (df['is_weekend'] == 1).any() else 0
    weekday_rate = float(df[df['is_weekend'] == 0]['failure'].mean()) if (df['is_weekend'] == 0).any() else 0

    # Churn analysis
    df['code_churn'] = df['added'] + df['removed']
    avg_churn_fail = float(df[df['failure'] == 1]['code_churn'].mean()) if failure_count > 0 else 0
    avg_churn_pass = float(df[df['failure'] == 0]['code_churn'].mean()) if (total - failure_count) > 0 else 0

    # Hotfix keyword frequency
    hotfix_count = int(df['message'].astype(str).str.contains(
        'fix|urgent|revert|hotfix|bug', case=False, na=False
    ).sum())

    return {
        "total_commits": total,
        "total_failures": failure_count,
        "failure_rate": round(failure_count / total, 4) if total > 0 else 0,
        "riskiest_hours": [{"hour": int(h), "failure_rate": round(r, 4)} for h, r in riskiest_hours],
        "weekend_failure_rate": round(weekend_rate, 4),
        "weekday_failure_rate": round(weekday_rate, 4),
        "avg_churn_failing_commits": round(avg_churn_fail, 1),
        "avg_churn_passing_commits": round(avg_churn_pass, 1),
        "hotfix_keyword_commits": hotfix_count,
        "hotfix_percentage": round(hotfix_count / total * 100, 1) if total > 0 else 0,
    }
