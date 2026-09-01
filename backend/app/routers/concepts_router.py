from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/concepts", tags=["concepts"])


@router.get("/", response_model=list[schemas.ConceptOut])
def list_concepts(subject: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Concept)
    if subject:
        query = query.filter_by(subject=subject)
    return query.all()
