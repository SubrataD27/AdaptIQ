"""
Bayesian Knowledge Tracing core — SoP US5 (Subrata): per-answer mastery
update; SoP US4 (Subrata): adaptive concept selection.

Standard 4-parameter BKT update, implemented directly (no pyBKT dependency).
p_init/p_learn/p_slip/p_guess are currently hand-set per concept in
app/data/data_structures.json; fitting them from pilot data (e.g. with pyBKT)
is planned future work.
"""
import random

DIFFICULTY_LEVELS = ("easy", "medium", "hard")


def update_mastery(p_prev: float, correct: bool, p_learn: float, p_slip: float, p_guess: float) -> float:
    """SoP US5 (Subrata): Bayes' rule posterior given the observed answer, then apply the learning transition."""
    if correct:
        numerator = p_prev * (1 - p_slip)
        denominator = numerator + (1 - p_prev) * p_guess
    else:
        numerator = p_prev * p_slip
        denominator = numerator + (1 - p_prev) * (1 - p_guess)

    p_posterior = numerator / denominator if denominator > 0 else p_prev
    p_next = p_posterior + (1 - p_posterior) * p_learn  # learning transition
    return min(max(p_next, 0.0), 1.0)


def select_next_concept(mastery_by_concept: dict[int, float], asked_concept_ids: set[int],
                        attempt_counts: dict[int, int] | None = None) -> int | None:
    """SoP US4 (Subrata): coverage-aware adaptive selection.

    Among concepts not yet asked this session, first prefer the ones the
    student has practised least (so every concept gets evidence before any
    is drilled again), then pick the lowest-mastery one among those.
    Without attempt_counts this falls back to plain lowest-mastery-first.
    Drilling only the lowest estimate leaves other concepts stuck at p_init,
    which the simulation (app/simulation.py) showed hurts whole-profile accuracy."""
    candidates = {cid: p for cid, p in mastery_by_concept.items() if cid not in asked_concept_ids}
    if not candidates:
        return None
    if attempt_counts is not None:
        fewest = min(attempt_counts.get(cid, 0) for cid in candidates)
        candidates = {cid: p for cid, p in candidates.items() if attempt_counts.get(cid, 0) == fewest}
    return min(candidates, key=candidates.get)


def target_difficulty(p_mastery: float) -> str:
    """Multi-level adaptivity: easy questions while a concept is weak (< 40%),
    medium while it is developing (40-70%), hard once it is strong (>= 70%)."""
    if p_mastery < 0.4:
        return "easy"
    if p_mastery < 0.7:
        return "medium"
    return "hard"


def select_question(questions: list, p_mastery: float, seen_counts: dict[int, int], rng=random):
    """Pick a question for the chosen concept: closest to the target difficulty
    first, then the one this student has seen least, ties broken at random."""
    target = DIFFICULTY_LEVELS.index(target_difficulty(p_mastery))

    def key(q):
        level = DIFFICULTY_LEVELS.index(q.difficulty) if q.difficulty in DIFFICULTY_LEVELS else 1
        return abs(level - target), seen_counts.get(q.id, 0)

    best = min(key(q) for q in questions)
    return rng.choice([q for q in questions if key(q) == best])
