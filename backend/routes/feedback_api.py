from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session
from db import SessionLocal
from models.prediction_feedback import PredictionFeedback
from typing import Optional

router = APIRouter(tags=["feedback"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/feedback")
def submit_feedback(
    prediction_risk: float = Body(...),
    prediction_reason: str = Body(""),
    risk_category: str = Body(""),
    actual_outcome: str = Body(...),  # "correct" or "incorrect"
    feedback_note: str = Body(""),
    db: Session = Depends(get_db),
):
    """Submit feedback on whether a prediction was accurate."""
    fb = PredictionFeedback(
        prediction_risk=prediction_risk,
        prediction_reason=prediction_reason,
        risk_category=risk_category,
        actual_outcome=actual_outcome,
        feedback_note=feedback_note,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return {"status": "success", "feedback_id": fb.id}


@router.get("/feedback/stats")
def feedback_stats(db: Session = Depends(get_db)):
    """Return aggregate accuracy stats from developer feedback."""
    total = db.query(PredictionFeedback).count()
    correct = (
        db.query(PredictionFeedback)
        .filter(PredictionFeedback.actual_outcome == "correct")
        .count()
    )
    incorrect = total - correct
    accuracy_rate = round(correct / total, 4) if total > 0 else None
    return {
        "total": total,
        "correct": correct,
        "incorrect": incorrect,
        "accuracy_rate": accuracy_rate,
    }


@router.get("/feedback/history")
def feedback_history(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Return paginated feedback history."""
    total = db.query(PredictionFeedback).count()
    entries = (
        db.query(PredictionFeedback)
        .order_by(PredictionFeedback.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "size": size,
        "entries": [
            {
                "id": e.id,
                "prediction_risk": e.prediction_risk,
                "prediction_reason": e.prediction_reason,
                "risk_category": e.risk_category,
                "actual_outcome": e.actual_outcome,
                "feedback_note": e.feedback_note,
                "created_at": str(e.created_at),
            }
            for e in entries
        ],
    }
