from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.routers import auth_router, questions_router, quiz_router, analytics_router, concepts_router
from app import seed

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AdaptIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"], allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(questions_router.router)
app.include_router(quiz_router.router)
app.include_router(analytics_router.router)
app.include_router(concepts_router.router)


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
