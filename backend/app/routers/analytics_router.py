import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, simulation

router = APIRouter(prefix="/analytics", tags=["analytics"])  # SoP US7/US8 (Subrata)


@router.get("/class-weak-concepts")
def class_weak_concepts(subject: str, db: Session = Depends(get_db)):
    """SoP US7 (Subrata): class-level weak-concept report for teachers."""
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
    """SoP US8 (Subrata): adaptive-vs-random research comparison, from real
    logged attempts (avg mastery shift per answer). See /analytics/simulation
    for the simulated-learner questions-to-convergence/error comparison."""
    results = {}
    for mode in ("adaptive", "random"):
        attempts = db.query(models.Attempt).filter_by(mode=mode).all()
        if not attempts:
            results[mode] = {"n_attempts": 0}
            continue
        avg_delta = sum(abs(a.p_mastery_after - a.p_mastery_before) for a in attempts) / len(attempts)
        results[mode] = {"n_attempts": len(attempts), "avg_mastery_shift_per_answer": avg_delta}
    return results


@router.get("/simulation")
def simulation_comparison(students: int = 30, questions: int = 30, seed: int = 42,
                           db: Session = Depends(get_db)):
    """SoP objective #5: simulated-learner adaptive-vs-random comparison
    (questions-to-convergence, mean absolute error), computed on demand
    using the live question bank's concepts and BKT parameters. See
    backend/app/simulation.py."""
    concepts = db.query(models.Concept).all()
    summary = simulation.run_simulation(concepts, n_students=students, n_questions=questions, seed=seed)
    if summary is None:
        raise HTTPException(404, "No concepts found — seed the question bank first")
    return summary


@router.get("/export-attempts")
def export_attempts(db: Session = Depends(get_db)):
    """Pilot-study export (SoP Research Plan methodology): every logged
    attempt as CSV, for analysis in Pandas/Matplotlib outside the app."""
    attempts = db.query(models.Attempt).order_by(models.Attempt.timestamp).all()
    students = {u.id: u.name for u in db.query(models.User).all()}
    concepts = {c.id: c.name for c in db.query(models.Concept).all()}
    quizzes = {q.id: q.title for q in db.query(models.Quiz).all()}

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "attempt_id", "student_id", "student_name", "concept_id", "concept_name",
        "quiz_id", "quiz_title", "mode", "is_correct", "p_mastery_before",
        "p_mastery_after", "timestamp",
    ])
    for a in attempts:
        writer.writerow([
            a.id, a.student_id, students.get(a.student_id, ""),
            a.concept_id, concepts.get(a.concept_id, ""),
            a.quiz_id or "", quizzes.get(a.quiz_id, "") if a.quiz_id else "",
            a.mode, a.is_correct, a.p_mastery_before, a.p_mastery_after,
            a.timestamp.isoformat(),
        ])
    buffer.seek(0)

    return StreamingResponse(
        buffer, media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=adaptiq_attempts.csv"},
    )
