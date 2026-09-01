from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth
from app.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])  # US-01, US-02


@router.post("/register", response_model=schemas.AuthResponse)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(email=payload.email).first():
        raise HTTPException(400, "Email already registered")
    user = models.User(
        name=payload.name, email=payload.email,
        hashed_password=auth.hash_password(payload.password), role=payload.role,
    )
    db.add(user); db.commit(); db.refresh(user)
    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "user": user}


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=payload.email).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "user": user}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
