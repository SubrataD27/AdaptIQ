import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.routers import auth_router, questions_router, quiz_router, analytics_router, concepts_router, quizzes_router
from app import seed

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AdaptIQ API")

# Local dev origins are always allowed. A hosted frontend is added with
# ALLOWED_ORIGINS (comma-separated) and/or ALLOWED_ORIGIN_REGEX, e.g.
# ALLOWED_ORIGIN_REGEX=https://adaptiq.*\.vercel\.app for Vercel preview URLs.
_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_origins += [o.strip().rstrip("/") for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=os.environ.get("ALLOWED_ORIGIN_REGEX") or None,
    allow_methods=["*"], allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(questions_router.router)
app.include_router(quiz_router.router)
app.include_router(analytics_router.router)
app.include_router(concepts_router.router)
app.include_router(quizzes_router.router)


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed.run_seed(db)
    finally:
        db.close()


@app.get("/")
def health():
    return {"status": "AdaptIQ API running"}
