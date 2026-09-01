from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, bkt
import random

router = APIRouter(prefix="/quiz", tags=["quiz"])  # SoP US4/US5 (Subrata); mastery-map endpoint below is backend support for SoP US6 (Annandita)


@router.get("/next-question/{student_id}")
def next_question(student_id: int, subject: str, mode: str = "adaptive",
                   exclude_concept_ids: str = "", db: Session = Depends(get_db)):
    """SoP US4 (Subrata): adaptive quiz delivery, plus the US8 random-baseline
    mode. exclude_concept_ids is a comma-separated list of concept ids
    already asked this session, so a session never repeats a concept."""
    concepts = db.query(models.Concept).filter_by(subject=subject).all()
    if not concepts:
        raise HTTPException(404, "No concepts for this subject")

    excluded = {int(x) for x in exclude_concept_ids.split(",") if x.strip().isdigit()}

    mastery_rows = {m.concept_id: m.p_mastery for m in
                     db.query(models.Mastery).filter_by(student_id=student_id).all()}
    for c in concepts:
        mastery_rows.setdefault(c.id, c.p_init)

    available = [c.id for c in concepts if c.id not in excluded]
    if not available:
        return {"question": None, "concept_id": None, "mode": mode, "complete": True}

    if mode == "random":
        concept_id = random.choice(available)
    else:
        concept_id = bkt.select_next_concept(mastery_rows, asked_concept_ids=excluded)
        if concept_id is None:
            return {"question": None, "concept_id": None, "mode": mode, "complete": True}

    question = db.query(models.Question).filter_by(concept_id=concept_id).first()
    if not question:
        raise HTTPException(404, "No question bank entry for selected concept")
    return {"question": question, "concept_id": concept_id, "mode": mode, "complete": False}


@router.post("/submit-answer")
def submit_answer(payload: schemas.AnswerSubmit, db: Session = Depends(get_db)):
    """SoP US5 (Subrata): BKT mastery update, fired on every answer, plus instant feedback."""
    question = db.query(models.Question).get(payload.question_id)
    if not question:
        raise HTTPException(404, "Question not found")
    concept = db.query(models.Concept).get(question.concept_id)
    is_correct = payload.selected_option == question.correct_option

    row = db.query(models.Mastery).filter_by(
        student_id=payload.student_id, concept_id=concept.id).first()
    p_before = row.p_mastery if row else concept.p_init

    p_after = bkt.update_mastery(p_before, is_correct, concept.p_learn, concept.p_slip, concept.p_guess)

    if row:
        row.p_mastery = p_after
    else:
        row = models.Mastery(student_id=payload.student_id, concept_id=concept.id, p_mastery=p_after)
        db.add(row)

    db.add(models.Attempt(
        student_id=payload.student_id, question_id=question.id, concept_id=concept.id,
        mode=payload.mode, is_correct=is_correct, p_mastery_before=p_before, p_mastery_after=p_after,
    ))
    db.commit()
    return {"correct": is_correct, "correct_option": question.correct_option,
            "p_mastery_before": p_before, "p_mastery_after": p_after}


@router.get("/mastery-map/{student_id}")
def mastery_map(student_id: int, db: Session = Depends(get_db)):
    """SoP US6 (Annandita): concept-wise mastery map data + weak-concept
    revision flags. Reassigned here from the adaptive-engine epic to match
    the finalized SoP ownership — logic unchanged, ownership label only."""
    rows = db.query(models.Mastery).filter_by(student_id=student_id).all()
    return [{"concept_id": r.concept_id, "p_mastery": r.p_mastery,
             "needs_revision": r.p_mastery < 0.6} for r in rows]


@router.get("/history/{student_id}")
def quiz_history(student_id: int, db: Session = Depends(get_db)):
    """Quiz history — supplementary; not one of the SoP's 8 core stories.
    Student's past attempts, grouped by session/date, with score."""
    attempts = (
        db.query(models.Attempt)
        .filter_by(student_id=student_id)
        .order_by(models.Attempt.timestamp.desc())
        .all()
    )
    concept_names = {c.id: c.name for c in db.query(models.Concept).all()}

    sessions: dict[str, dict] = {}
    for a in attempts:
        key = a.timestamp.strftime("%Y-%m-%d")
        session = sessions.setdefault(key, {"date": key, "attempts": [], "correct": 0, "total": 0})
        session["attempts"].append({
            "question_id": a.question_id,
            "concept": concept_names.get(a.concept_id, "Unknown"),
            "mode": a.mode,
            "is_correct": a.is_correct,
            "timestamp": a.timestamp.isoformat(),
        })
        session["total"] += 1
        if a.is_correct:
            session["correct"] += 1

    return sorted(sessions.values(), key=lambda s: s["date"], reverse=True)
