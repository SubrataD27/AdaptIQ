import os
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

# Hosted deployments set SECRET_KEY (render.yaml generates one); local dev falls back.
SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-before-deploy")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_minutes: int = 60 * 24) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=expires_minutes)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
