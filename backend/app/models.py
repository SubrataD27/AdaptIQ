import json

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "teacher" | "student"


class Concept(Base):
    __tablename__ = "concepts"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    # BKT parameters (SoP US5, Subrata: defaults for the mastery-update model)
    p_init = Column(Float, default=0.3)
    p_learn = Column(Float, default=0.2)
    p_slip = Column(Float, default=0.1)
    p_guess = Column(Float, default=0.2)


class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True)
    concept_id = Column(Integer, ForeignKey("concepts.id"))
    text = Column(String, nullable=False)
    option_a = Column(String)
    option_b = Column(String)
    option_c = Column(String)
    option_d = Column(String)
    correct_option = Column(String)  # "a"|"b"|"c"|"d"
    difficulty = Column(String, default="medium")
    concept = relationship("Concept")


class Quiz(Base):
    """SoP US2 (Annandita): a teacher-published quiz — a subject plus a
    chosen subset of its concepts, shared with students."""
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True)
    subject = Column(String, nullable=False)
    title = Column(String, nullable=False)
    concept_ids_json = Column(String, nullable=False, default="[]")
    teacher_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def concept_ids(self) -> list[int]:
        return json.loads(self.concept_ids_json)

    @concept_ids.setter
    def concept_ids(self, value: list[int]) -> None:
        self.concept_ids_json = json.dumps(value)


class Mastery(Base):
    """Per-student, per-concept current BKT mastery probability.
    Updated per SoP US5 (Subrata); displayed per SoP US6 (Annandita)."""
    __tablename__ = "mastery"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    concept_id = Column(Integer, ForeignKey("concepts.id"))
    p_mastery = Column(Float, default=0.3)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Attempt(Base):
    """Interaction log — every answered question. Powers SoP US7/US8 (Subrata) analytics."""
    __tablename__ = "attempts"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    concept_id = Column(Integer, ForeignKey("concepts.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True)  # SoP US2: set when answered as part of a published quiz
    mode = Column(String, default="adaptive")  # "adaptive" | "random" — SoP US8
    is_correct = Column(Boolean)
    p_mastery_before = Column(Float)
    p_mastery_after = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
