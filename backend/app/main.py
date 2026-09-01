from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth_router, questions_router, quiz_router, analytics_router

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


@app.get("/")
def health():
    return {"status": "AdaptIQ API running"}
