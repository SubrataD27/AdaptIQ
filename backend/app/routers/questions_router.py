from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/questions", tags=["questions"])  # US-03, US-04


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
