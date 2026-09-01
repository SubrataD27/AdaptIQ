from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/questions", tags=["questions"])  # SoP US1 (Annandita): concept + difficulty tagged question bank CRUD

# NOTE — SoP US2 (Annandita): "teacher creates a quiz for a subject and
# shares it with a class" is NOT built yet. There is no discrete Quiz
# entity; students currently pull questions by subject rather than
# attempting a specific teacher-published quiz. See EXECUTION_PLAN.md
# Phase B.


@router.post("/")
def create_question(payload: schemas.QuestionCreate, db: Session = Depends(get_db)):
    q = models.Question(**payload.dict())
    db.add(q); db.commit(); db.refresh(q)
    return q


@router.get("/")
def list_questions(concept_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Question)
    if concept_id:
        query = query.filter_by(concept_id=concept_id)
    return query.all()
