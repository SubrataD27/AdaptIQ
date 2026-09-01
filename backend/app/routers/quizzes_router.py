from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/quizzes", tags=["quizzes"])  # SoP US2 (Annandita): teacher creates a quiz and shares it with a class


@router.post("/", response_model=schemas.QuizOut)
def create_quiz(payload: schemas.QuizCreate,
                 current_user: models.User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    if current_user.role != "teacher":
        raise HTTPException(403, "Only teachers can create quizzes")
    if not payload.concept_ids:
        raise HTTPException(400, "A quiz needs at least one concept")

    quiz = models.Quiz(subject=payload.subject, title=payload.title,
                        teacher_id=current_user.id, is_active=True)
    quiz.concept_ids = payload.concept_ids
    db.add(quiz); db.commit(); db.refresh(quiz)
    return quiz


@router.get("/", response_model=list[schemas.QuizOut])
def list_quizzes(subject: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Quiz)
    if subject:
        query = query.filter_by(subject=subject)
    return query.order_by(models.Quiz.created_at.desc()).all()


@router.get("/active", response_model=list[schemas.QuizOut])
def active_quizzes(subject: str, db: Session = Depends(get_db)):
    return (
        db.query(models.Quiz)
        .filter_by(subject=subject, is_active=True)
        .order_by(models.Quiz.created_at.desc())
        .all()
    )
