"""Seeds the question bank for the pilot subject from app/data/data_structures.json
(10 concepts x 15 questions: 5 easy, 5 medium, 5 hard). Idempotent.

Each question is authored as [difficulty, text, correct, wrong, wrong, wrong].
The four options are shuffled with a seed derived from the question text, so
the correct letter varies but is the same on every machine and every reset."""
import hashlib
import json
import random
from pathlib import Path

from sqlalchemy.orm import Session
from app import models

DATA_FILE = Path(__file__).parent / "data" / "data_structures.json"
LETTERS = "abcd"


def load_bank() -> dict:
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


SUBJECT = load_bank()["subject"]


def build_question(concept_id: int, item: list) -> models.Question:
    difficulty, text, correct, *wrong = item
    options = [correct, *wrong]
    rng = random.Random(int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16))
    rng.shuffle(options)
    return models.Question(
        concept_id=concept_id, text=text, difficulty=difficulty,
        option_a=options[0], option_b=options[1], option_c=options[2], option_d=options[3],
        correct_option=LETTERS[options.index(correct)],
    )


def run_seed(db: Session) -> None:
    if db.query(models.Concept).filter_by(subject=SUBJECT).first():
        print("Already seeded.")
        return

    bank = load_bank()
    n_questions = 0
    for c in bank["concepts"]:
        concept = models.Concept(subject=SUBJECT, name=c["name"], p_init=c["p_init"], p_learn=c["p_learn"],
                                 p_slip=c["p_slip"], p_guess=c["p_guess"])
        db.add(concept)
        db.flush()
        for item in c["questions"]:
            db.add(build_question(concept.id, item))
            n_questions += 1

    db.commit()
    print(f"Seeded {len(bank['concepts'])} concepts and {n_questions} questions.")
