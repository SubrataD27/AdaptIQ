from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, bkt
import random

router = APIRouter(prefix="/quiz", tags=["quiz"])  # US-05 through US-11


@router.get("/next-question/{student_id}")
def next_question(student_id: int, subject: str, mode: str = "adaptive", db: Session = Depends(get_db)):
    """US-07 (adaptive) / US-08 (random baseline)."""
    concepts = db.query(models.Concept).filter_by(subject=subject).all()
    if not concepts:
        raise HTTPException(404, "No concepts for this subject")

    mastery_rows = {m.concept_id: m.p_mastery for m in
                     db.query(models.Mastery).filter_by(student_id=student_id).all()}
    for c in concepts:
        mastery_rows.setdefault(c.id, c.p_init)

    if mode == "random":
        concept_id = random.choice([c.id for c in concepts])
    else:
        concept_id = bkt.select_next_concept(mastery_rows, asked_concept_ids=set())

    question = db.query(models.Question).filter_by(concept_id=concept_id).first()
    if not question:
        raise HTTPException(404, "No question bank entry for selected concept")
    return {"question": question, "concept_id": concept_id, "mode": mode}


@router.post("/submit-answer")
def submit_answer(payload: schemas.AnswerSubmit, db: Session = Depends(get_db)):
    """US-06 (BKT update) + US-09 (instant feedback)."""
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
    """US-10: concept-wise mastery map + weak-concept flags for revision (US-11)."""
    rows = db.query(models.Mastery).filter_by(student_id=student_id).all()
    return [{"concept_id": r.concept_id, "p_mastery": r.p_mastery,
             "needs_revision": r.p_mastery < 0.6} for r in rows]
