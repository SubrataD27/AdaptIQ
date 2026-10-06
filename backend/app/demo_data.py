"""Seeds a believable in-progress class for the demo: a demo teacher, a
published "Live Demo Quiz" covering every concept, and a class of students
with two weeks of quiz history.

The data is generated to follow the same rules as the live app, so every
number on screen is internally consistent:
- Each student has a hidden known/unknown state per concept (the BKT
  generative model). Answers are simulated from it using each concept's own
  p_slip/p_guess, and an unknown concept can become known after practice
  (p_learn).
- Students take quiz *sessions* of 4-6 questions. A session never repeats a
  concept, adaptive sessions pick concepts with the real
  bkt.select_next_concept, and random sessions pick uniformly, the same as
  /quiz/next-question.
- Mastery is updated with the real bkt.update_mastery after every answer,
  and each Attempt logs the before/after values that the Research page and
  CSV export read.
- Some sessions are tied to "Live Demo Quiz" (quiz_id set), and only happen
  after the quiz was published.

Idempotent: users and the quiz are get-or-create, and a student who already
has attempts is skipped, so re-running never duplicates anything. A fixed
RNG seed means every fresh reset produces the same class.

Run from backend/, inside the venv (start.sh does this for you):
    python -m app.demo_data
"""
import random
from datetime import datetime, timedelta, timezone

from app.database import Base, SessionLocal, engine
from app import auth, bkt, models, seed

SUBJECT = "Data Structures"
DEMO_PASSWORD = "Demo1234!"
DEMO_TEACHER = {"name": "Demo Teacher", "email": "demo.teacher@adaptiq.test"}
DEMO_QUIZ_TITLE = "Live Demo Quiz"
QUIZ_PUBLISHED_DAYS_AGO = 7

# (name, email, overall skill: rough chance of already knowing a concept)
DEMO_STUDENTS = [
    {"name": "Ananya Rao", "email": "ananya.demo@adaptiq.test", "skill": 0.7},
    {"name": "Rohit Verma", "email": "rohit.demo@adaptiq.test", "skill": 0.35},
    {"name": "Meera Iyer", "email": "meera.demo@adaptiq.test", "skill": 0.55},
    {"name": "Arjun Nair", "email": "arjun.demo@adaptiq.test", "skill": 0.8},
    {"name": "Priya Sharma", "email": "priya.demo@adaptiq.test", "skill": 0.6},
    {"name": "Karan Mehta", "email": "karan.demo@adaptiq.test", "skill": 0.3},
    {"name": "Sneha Patel", "email": "sneha.demo@adaptiq.test", "skill": 0.65},
    {"name": "Vikram Singh", "email": "vikram.demo@adaptiq.test", "skill": 0.45},
    {"name": "Divya Menon", "email": "divya.demo@adaptiq.test", "skill": 0.75},
    {"name": "Aditya Das", "email": "aditya.demo@adaptiq.test", "skill": 0.4},
    {"name": "Ishita Ghosh", "email": "ishita.demo@adaptiq.test", "skill": 0.5},
    {"name": "Rahul Mishra", "email": "rahul.demo@adaptiq.test", "skill": 0.55},
]
# Per-concept shift on a student's skill, so the class report tells a clear
# story: fundamentals (Arrays, Stacks, Queues) strong, Trees/Graphs weak.
CONCEPT_EASE = {"Arrays": 0.2, "Stacks": 0.15, "Queues": 0.1,
                "Linked Lists": -0.05, "Trees": -0.35, "Graphs": -0.45}
# Fraction of each concept's p_learn applied to the hidden state per practice
# answer: a single MCQ teaches less than BKT's per-opportunity assumption.
LEARN_SCALE = 0.4
SESSIONS_PER_STUDENT = (3, 4)
QUESTIONS_PER_SESSION = (4, 6)
HISTORY_DAYS = 14
RNG_SEED = 2024


def _utcnow():
    # Naive UTC, matching the models' datetime.utcnow defaults.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_or_create_user(db, info, role):
    user = db.query(models.User).filter_by(email=info["email"]).first()
    if user:
        return user
    user = models.User(
        name=info["name"], email=info["email"],
        hashed_password=auth.hash_password(DEMO_PASSWORD), role=role,
    )
    db.add(user); db.commit(); db.refresh(user)
    return user


def get_or_create_demo_quiz(db, teacher, concepts):
    quiz = db.query(models.Quiz).filter_by(title=DEMO_QUIZ_TITLE, subject=SUBJECT).first()
    if quiz:
        return quiz
    quiz = models.Quiz(subject=SUBJECT, title=DEMO_QUIZ_TITLE, teacher_id=teacher.id, is_active=True,
                       created_at=_utcnow() - timedelta(days=QUIZ_PUBLISHED_DAYS_AGO, hours=2))
    quiz.concept_ids = [c.id for c in concepts]
    db.add(quiz); db.commit(); db.refresh(quiz)
    return quiz


def seed_student(db, rng, student, skill, concepts, questions_by_concept, quiz):
    """Logs a few quiz sessions for one student. Returns the number of answers."""
    knows = {c.id: rng.random() < min(max(skill + CONCEPT_EASE.get(c.name, 0.0), 0.05), 0.95)
             for c in concepts}
    by_id = {c.id: c for c in concepts}
    mastery_rows = {}  # concept_id -> Mastery row, so each pair is inserted exactly once

    n_sessions = rng.randint(*SESSIONS_PER_STUDENT)
    days_ago = sorted(rng.sample(range(1, HISTORY_DAYS), n_sessions), reverse=True)
    n_answers = 0

    for s, day in enumerate(days_ago):
        # Quiz-scoped sessions only once the quiz exists; the latest session
        # is always the published quiz so the class has visible quiz activity.
        use_quiz = day < QUIZ_PUBLISHED_DAYS_AGO and (s == n_sessions - 1 or rng.random() < 0.5)
        mode = "adaptive" if rng.random() < 0.67 else "random"
        ts = (_utcnow() - timedelta(days=day)).replace(
            hour=rng.randint(9, 20), minute=rng.randint(0, 59), second=0, microsecond=0)

        asked: set[int] = set()
        for _ in range(rng.randint(*QUESTIONS_PER_SESSION)):
            estimates = {cid: (mastery_rows[cid].p_mastery if cid in mastery_rows else by_id[cid].p_init)
                         for cid in by_id}
            if mode == "adaptive":
                concept_id = bkt.select_next_concept(estimates, asked_concept_ids=asked)
            else:
                concept_id = rng.choice([cid for cid in by_id if cid not in asked])
            concept = by_id[concept_id]
            asked.add(concept_id)

            question = rng.choice(questions_by_concept[concept_id])
            if knows[concept_id]:
                is_correct = rng.random() > concept.p_slip
            else:
                is_correct = rng.random() < concept.p_guess

            p_before = estimates[concept_id]
            p_after = bkt.update_mastery(p_before, is_correct, concept.p_learn, concept.p_slip, concept.p_guess)

            row = mastery_rows.get(concept_id) or db.query(models.Mastery).filter_by(
                student_id=student.id, concept_id=concept_id).first()
            if row:
                row.p_mastery = p_after
                row.updated_at = ts
            else:
                row = models.Mastery(student_id=student.id, concept_id=concept_id,
                                     p_mastery=p_after, updated_at=ts)
                db.add(row)
            # Session uses autoflush=False, so without this a later lookup for
            # the same concept misses the pending row and inserts a duplicate.
            db.flush()
            mastery_rows[concept_id] = row

            db.add(models.Attempt(
                student_id=student.id, question_id=question.id, concept_id=concept_id,
                quiz_id=quiz.id if use_quiz else None, mode=mode, is_correct=is_correct,
                p_mastery_before=p_before, p_mastery_after=p_after, timestamp=ts,
            ))
            n_answers += 1
            ts += timedelta(seconds=rng.randint(25, 90))

            # Practising can teach the concept (BKT learning transition).
            if not knows[concept_id] and rng.random() < concept.p_learn * LEARN_SCALE:
                knows[concept_id] = True

    db.commit()
    return n_answers, n_sessions


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    rng = random.Random(RNG_SEED)
    try:
        seed.run_seed(db)  # no-op if the API already seeded the question bank
        concepts = db.query(models.Concept).filter_by(subject=SUBJECT).order_by(models.Concept.id).all()
        questions_by_concept = {c.id: db.query(models.Question).filter_by(concept_id=c.id).all()
                                for c in concepts}

        teacher = get_or_create_user(db, DEMO_TEACHER, "teacher")
        quiz = get_or_create_demo_quiz(db, teacher, concepts)
        print(f"Teacher: {teacher.email} / {DEMO_PASSWORD}; quiz '{quiz.title}' "
              f"covers {len(quiz.concept_ids)} concepts.")

        total = 0
        for info in DEMO_STUDENTS:
            student = get_or_create_user(db, info, "student")
            if db.query(models.Attempt).filter_by(student_id=student.id).first():
                print(f"  {info['name']}: already has attempts, skipping.")
                continue
            n_answers, n_sessions = seed_student(
                db, rng, student, info["skill"], concepts, questions_by_concept, quiz)
            total += n_answers
            print(f"  {info['name']:<14} {n_sessions} sessions, {n_answers} answers  ({info['email']})")

        print(f"Demo class ready: {len(DEMO_STUDENTS)} students, {total} new answers. "
              f"All demo passwords: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
