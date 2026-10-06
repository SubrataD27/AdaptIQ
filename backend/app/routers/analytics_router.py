import csv
import io
from datetime import datetime, timedelta

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


@router.get("/overview")
def class_overview(subject: str, db: Session = Depends(get_db)):
    """Headline numbers for the teacher dashboard (supports SoP US7)."""
    concept_ids = [c.id for c in db.query(models.Concept).filter_by(subject=subject).all()]
    attempts = db.query(models.Attempt).filter(models.Attempt.concept_id.in_(concept_ids)).all()
    masteries = db.query(models.Mastery).filter(models.Mastery.concept_id.in_(concept_ids)).all()
    return {
        "n_students": db.query(models.User).filter_by(role="student").count(),
        "n_active_students": len({a.student_id for a in attempts}),
        "n_attempts": len(attempts),
        "accuracy": (sum(a.is_correct for a in attempts) / len(attempts)) if attempts else None,
        "avg_mastery": (sum(m.p_mastery for m in masteries) / len(masteries)) if masteries else None,
        "n_concepts": len(concept_ids),
        "n_questions": db.query(models.Question).filter(models.Question.concept_id.in_(concept_ids)).count(),
        "n_quizzes": db.query(models.Quiz).filter_by(subject=subject).count(),
    }


@router.get("/students")
def student_roster(subject: str, db: Session = Depends(get_db)):
    """Per-student progress for the teacher dashboard (supports SoP US7):
    average mastery, answers, accuracy, weakest concept, last activity."""
    concepts = {c.id: c.name for c in db.query(models.Concept).filter_by(subject=subject).all()}
    roster = []
    for s in db.query(models.User).filter_by(role="student").order_by(models.User.name).all():
        masteries = [m for m in db.query(models.Mastery).filter_by(student_id=s.id).all() if m.concept_id in concepts]
        attempts = [a for a in db.query(models.Attempt).filter_by(student_id=s.id).all() if a.concept_id in concepts]
        weakest = min(masteries, key=lambda m: m.p_mastery) if masteries else None
        roster.append({
            "student_id": s.id,
            "name": s.name,
            "email": s.email,
            "avg_mastery": (sum(m.p_mastery for m in masteries) / len(masteries)) if masteries else None,
            "n_attempts": len(attempts),
            "accuracy": (sum(a.is_correct for a in attempts) / len(attempts)) if attempts else None,
            "weakest_concept": concepts[weakest.concept_id] if weakest else None,
            "mastery_by_concept": {m.concept_id: m.p_mastery for m in masteries},
            "last_active": max(a.timestamp for a in attempts).isoformat() if attempts else None,
        })
    return roster


@router.get("/activity")
def class_activity(subject: str, days: int = 14, db: Session = Depends(get_db)):
    """Answers, accuracy and active students per day for the last `days`
    days (supports SoP US7's teacher view)."""
    concept_ids = [c.id for c in db.query(models.Concept).filter_by(subject=subject).all()]
    today = datetime.utcnow().date()
    start = today - timedelta(days=days - 1)
    buckets = {start + timedelta(days=i): {"answers": 0, "correct": 0, "students": set()} for i in range(days)}
    attempts = (db.query(models.Attempt)
                .filter(models.Attempt.concept_id.in_(concept_ids),
                        models.Attempt.timestamp >= datetime.combine(start, datetime.min.time()))
                .all())
    for a in attempts:
        b = buckets.get(a.timestamp.date())
        if b is None:
            continue
        b["answers"] += 1
        b["correct"] += bool(a.is_correct)
        b["students"].add(a.student_id)
    return [{"day": d.isoformat(), "answers": b["answers"],
             "accuracy": (b["correct"] / b["answers"]) if b["answers"] else None,
             "active_students": len(b["students"])} for d, b in sorted(buckets.items())]


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
