"""
SoP objective #5 / US8 (Subrata): simulated-learner framework comparing
adaptive vs. random question selection.

Generates simulated students with a known ground-truth mastery per
concept, then measures how many questions each selection strategy needs
before its BKT estimate converges near the ground truth (mean absolute
error at or below CONVERGENCE_EPSILON, sustained for CONVERGENCE_STREAK
consecutive questions), and how accurate the final estimate is. Uses the
same BKT engine (backend/app/bkt.py) and each concept's live
p_init/p_learn/p_slip/p_guess parameters as the live quiz flow, so results
reflect the actual seeded question bank rather than made-up constants.

Run standalone: `python -m app.simulation` (from backend/, inside venv).
"""
import argparse
import random
import statistics

from app.database import Base, SessionLocal, engine
from app import bkt, models

CONVERGENCE_EPSILON = 0.1
CONVERGENCE_STREAK = 3


def simulate_response(rng: random.Random, true_mastery: float, p_slip: float, p_guess: float) -> bool:
    """Same observation model the BKT update assumes: a student who
    'knows' a concept can still slip; one who doesn't can still guess right."""
    knows = rng.random() < true_mastery
    if knows:
        return rng.random() > p_slip
    return rng.random() < p_guess


def run_trial(rng: random.Random, concepts: list, true_mastery: dict, mode: str, n_questions: int):
    """One simulated student answering n_questions in the given mode.
    Returns (questions_to_convergence or None, final mean |error| across concepts)."""
    estimate = {c.id: c.p_init for c in concepts}
    streak = 0
    converged_at = None

    for q in range(1, n_questions + 1):
        if mode == "random":
            concept = rng.choice(concepts)
        else:
            concept_id = bkt.select_next_concept(estimate, asked_concept_ids=set())
            concept = next(c for c in concepts if c.id == concept_id)

        correct = simulate_response(rng, true_mastery[concept.id], concept.p_slip, concept.p_guess)
        estimate[concept.id] = bkt.update_mastery(
            estimate[concept.id], correct, concept.p_learn, concept.p_slip, concept.p_guess)

        avg_error = statistics.mean(abs(estimate[c.id] - true_mastery[c.id]) for c in concepts)
        if avg_error <= CONVERGENCE_EPSILON:
            streak += 1
            if streak >= CONVERGENCE_STREAK and converged_at is None:
                converged_at = q
        else:
            streak = 0

    final_mae = statistics.mean(abs(estimate[c.id] - true_mastery[c.id]) for c in concepts)
    return converged_at, final_mae


def run_simulation(concepts: list, n_students: int = 30, n_questions: int = 30, seed: int = 42):
    """Returns a summary dict keyed by mode, or None if there are no concepts to simulate.
    Uses a local RNG instance — never touches the global `random` module, so
    this is safe to call from a live request handler without perturbing the
    app's own random-mode question selection."""
    if not concepts:
        return None

    rng = random.Random(seed)
    results = {"adaptive": {"convergence": [], "mae": []}, "random": {"convergence": [], "mae": []}}

    for _ in range(n_students):
        true_mastery = {c.id: rng.random() for c in concepts}
        for mode in ("adaptive", "random"):
            converged_at, mae = run_trial(rng, concepts, true_mastery, mode, n_questions)
            results[mode]["mae"].append(mae)
            if converged_at is not None:
                results[mode]["convergence"].append(converged_at)

    summary = {}
    for mode in ("adaptive", "random"):
        conv = results[mode]["convergence"]
        summary[mode] = {
            "n_students": n_students,
            "n_questions_per_student": n_questions,
            "mean_absolute_error": round(statistics.mean(results[mode]["mae"]), 4),
            "pct_converged": round(100 * len(conv) / n_students, 1),
            "mean_questions_to_convergence": round(statistics.mean(conv), 2) if conv else None,
        }
    return summary


def main():
    parser = argparse.ArgumentParser(description="AdaptIQ simulated-learner adaptive-vs-random comparison")
    parser.add_argument("--students", type=int, default=30)
    parser.add_argument("--questions", type=int, default=30)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        concepts = db.query(models.Concept).all()
    finally:
        db.close()

    summary = run_simulation(concepts, args.students, args.questions, args.seed)
    if summary is None:
        print("No concepts found — start the API once first so it seeds the question bank.")
        return

    print(f"\nSimulated {args.students} students x {args.questions} questions each (seed={args.seed})\n")
    header = f"{'Mode':<10}{'Mean |error|':<14}{'% converged':<14}{'Mean Q-to-converge':<20}"
    print(header)
    print("-" * len(header))
    for mode, s in summary.items():
        conv_str = str(s["mean_questions_to_convergence"]) if s["mean_questions_to_convergence"] is not None else "n/a"
        print(f"{mode:<10}{s['mean_absolute_error']:<14}{s['pct_converged']:<14}{conv_str:<20}")


if __name__ == "__main__":
    main()
