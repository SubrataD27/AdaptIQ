from fastapi import Depends, HTTPException, Header
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app import auth, models
from app.database import get_db


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> models.User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

    user_id = payload.get("sub")
    user = db.query(models.User).get(int(user_id)) if user_id else None
    if not user:
        raise HTTPException(401, "User not found")
    return user
