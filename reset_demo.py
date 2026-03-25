import sqlite3
import os
import json

# DB path relative to script
DB_PATH = "backend/db/dev.db"

def reset_db():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}. Run the backend first.")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Cleaning up old predictions...")
    cur.execute("DELETE FROM vcs_predictions")
    
    print("Forcing a fresh High-Risk prediction for the demo...")
    mock_shap = [
        {"feature": "Code Churn", "shap_value": 0.452, "value": 850},
        {"feature": "Commit Hour", "shap_value": 0.328, "value": "3:00 AM"},
        {"feature": "Fix Keyword", "shap_value": 0.15, "value": "Present"}
    ]
    
    mock_suggestions = [
        {"icon": "🛑", "title": "Stall Deployment", "detail": "Massive nighttime hotfixes have a 65% higher regression rate. Intervene with a senior peer review."},
        {"icon": "🌿", "title": "Sustainability Risk", "detail": "A failing build cycle for this diff would waste ~1.4kg of CO2."}
    ]

    cur.execute("""
        INSERT INTO vcs_predictions (branch, commit_sha, risk_score, risk_category, explanation, shap_json, suggestions_json, features_json, posted_to_vcs, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """, (
        "feature/anti-gravity-core",
        "demo_manual_fix",
        0.92,
        "High",
        "Extreme code churn (850 lines) · Late-night session · Fix keywords detected",
        json.dumps(mock_shap),
        json.dumps(mock_suggestions),
        '{"code_churn": 850, "commit_hour": 3, "has_fix": 1, "num_files": 12}',
        0
    ))

    conn.commit()
    conn.close()
    print("SUCCESS: Database cleaned and 92% High Risk prediction injected!")
    print("Refresh your dashboard now (localhost:3000/dashboard).")

if __name__ == "__main__":
    reset_db()
