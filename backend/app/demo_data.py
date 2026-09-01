"""Seeds a believable in-progress class for the demo: a few fake students
each answer 8-10 questions across mixed concepts, using the same BKT update
logic as the live quiz flow so the resulting mastery/weak-concept numbers
are consistent with reality. Idempotent per student email — safe to re-run.

Run from backend/, inside the venv, after the API has started at least once
(so the question bank is seeded):
    python -m app.demo_data
"""
import random

from app.database import Base, SessionLocal, engine
from app import auth, bkt, models

SUBJECT = "Data Structures"
DEMO_STUDENTS = [
    {"name": "Ananya Rao", "email": "ananya.demo@adaptiq.test"},
    {"name": "Rohit Verma", "email": "rohit.demo@adaptiq.test"},
    {"name": "Meera Iyer", "email": "meera.demo@adaptiq.test"},
]
# Rough per-student skill level: probability of answering any question correctly.
STUDENT_SKILL = [0.75, 0.4, 0.6]
DEMO_PASSWORD = "Demo1234!"


def get_or_create_student(db, info):
    user = db.query(models.User).filter_by(email=info["email"]).first()
    if user:
        return user
    user = models.User(
        name=info["name"], email=info["email"],
        hashed_password=auth.hash_password(DEMO_PASSWORD), role="student",
    )
    db.add(user); db.commit(); db.refresh(user)
    return user


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        concepts = db.query(models.Concept).filter_by(subject=SUBJECT).all()
        if not concepts:
            print("No concepts found — start the API once first so it seeds the question bank.")
            return

        for info, skill in zip(DEMO_STUDENTS, STUDENT_SKILL):
            student = get_or_create_student(db, info)
            n_answers = random.randint(8, 10)
            touched_concepts = set()

            for i in range(n_answers):
                concept = random.choice(concepts)
                question = db.query(models.Question).filter_by(concept_id=concept.id).first()
                if not question:
                    continue
                mode = "random" if i % 3 == 0 else "adaptive"

                row = db.query(models.Mastery).filter_by(
                    student_id=student.id, concept_id=concept.id).first()
                p_before = row.p_mastery if row else concept.p_init
                is_correct = random.random() < skill
                p_after = bkt.update_mastery(
                    p_before, is_correct, concept.p_learn, concept.p_slip, concept.p_guess)

                if row:
                    row.p_mastery = p_after
                else:
                    row = models.Mastery(student_id=student.id, concept_id=concept.id, p_mastery=p_after)
                    db.add(row)

                db.add(models.Attempt(
                    student_id=student.id, question_id=question.id, concept_id=concept.id,
                    mode=mode, is_correct=is_correct, p_mastery_before=p_before, p_mastery_after=p_after,
                ))
                touched_concepts.add(concept.name)

            db.commit()
            print(f"{info['name']}: {n_answers} answers logged across {len(touched_concepts)} concepts "
                  f"(login: {info['email']} / {DEMO_PASSWORD}).")
    finally:
        db.close()


if __name__ == "__main__":
    run()
