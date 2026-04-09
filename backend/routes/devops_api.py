from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db import SessionLocal
from models.vcs_prediction import VCSPrediction
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/devops", tags=["DevOps Intelligence"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/stats")
def get_devops_stats(db: Session = Depends(get_db)):
    """
    Calculates DORA metrics based on historical prediction data.
    """
    now = datetime.utcnow()
    last_7_days = now - timedelta(days=7)

    # 1. Deployment Frequency (Total pushes in last 7 days)
    total_deploys = db.query(VCSPrediction).filter(VCSPrediction.timestamp >= last_7_days).count()
    deploy_freq = round(total_deploys / 7, 2) if total_deploys > 0 else 0.5 # Default for demo

    # 2. Change Failure Rate (High risk predictions vs total)
    high_risk_count = db.query(VCSPrediction).filter(
        VCSPrediction.timestamp >= last_7_days,
        VCSPrediction.risk_score > 0.7
    ).count()
    
    failure_rate = round((high_risk_count / total_deploys) * 100, 1) if total_deploys > 0 else 4.2

    # 3. Mean Time to Recover (MTTR) - Simulated for now
    mttr = "42m" if failure_rate < 10 else "1h 15m"

    # 4. Lead Time for Changes - Simulated for now
    lead_time = "18m" if total_deploys > 10 else "2h 45m"

    return {
        "dora": {
            "deployment_frequency": {"value": f"{deploy_freq}/day", "status": "Elite" if deploy_freq > 2 else "High"},
            "change_failure_rate": {"value": f"{failure_rate}%", "status": "Elite" if failure_rate < 5 else "Medium"},
            "mttr": {"value": mttr, "status": "High"},
            "lead_time": {"value": lead_time, "status": "Elite"}
        },
        "cluster_health": {
            "nodes_online": 98,
            "total_nodes": 100,
            "active_pods": 442,
            "cpu_utilization": "62%",
            "memory_utilization": "74%",
            "status": "Healthy"
        }
    }

@router.get("/cluster-grid")
def get_cluster_grid():
    """
    Generates a 10x10 grid of simulated node statuses for the dashboard.
    """
    grid = []
    for i in range(100):
        # Mostly healthy (0), some warnings (1), rare errors (2)
        rand = random.random()
        status = 0
        if rand > 0.95: status = 2
        elif rand > 0.85: status = 1
        
        grid.append({
            "id": f"node-{i}",
            "status": status,
            "load": random.randint(20, 90)
        })
    return grid
