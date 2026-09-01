from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models

router = APIRouter(prefix="/analytics", tags=["analytics"])  # US-12, US-14, US-15


@router.get("/class-weak-concepts")
def class_weak_concepts(subject: str, db: Session = Depends(get_db)):
    """US-12: class-level weak-concept report for teachers."""
    rows = (
        db.query(models.Concept.id, models.Concept.name, func.avg(models.Mastery.p_mastery).label("avg_mastery"))
        .join(models.Mastery, models.Mastery.concept_id == models.Concept.id)
        .filter(models.Concept.subject == subject)
        .group_by(models.Concept.id)
        .order_by("avg_mastery")
        .all()
    )
    return [{"concept_id": r.id, "concept": r.name, "avg_mastery": float(r.avg_mastery)} for r in rows]


@router.get("/adaptive-vs-random")
def adaptive_vs_random(db: Session = Depends(get_db)):
    """US-14: research comparison — mean questions-to-convergence + mean |error| per mode."""
    results = {}
    for mode in ("adaptive", "random"):
        attempts = db.query(models.Attempt).filter_by(mode=mode).all()
        if not attempts:
            results[mode] = {"n_attempts": 0}
            continue
        avg_delta = sum(abs(a.p_mastery_after - a.p_mastery_before) for a in attempts) / len(attempts)
        results[mode] = {"n_attempts": len(attempts), "avg_mastery_shift_per_answer": avg_delta}
    return results
