from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/auth", tags=["auth"])  # US-01, US-02


@router.post("/register", response_model=schemas.Token)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(email=payload.email).first():
        raise HTTPException(400, "Email already registered")
    user = models.User(
        name=payload.name, email=payload.email,
        hashed_password=auth.hash_password(payload.password), role=payload.role,
    )
    db.add(user); db.commit(); db.refresh(user)
    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token}


@router.post("/login", response_model=schemas.Token)
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=email).first()
    if not user or not auth.verify_password(password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token}
