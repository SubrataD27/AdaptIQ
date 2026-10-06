"""
Bayesian Knowledge Tracing core — SoP US5 (Subrata): per-answer mastery
update; SoP US4 (Subrata): adaptive concept selection.

Standard 4-parameter BKT update (no external pyBKT dependency needed for the
live per-answer update; pyBKT is used offline to *fit* p_learn/p_slip/p_guess
from pilot data — see scripts/fit_bkt_params.py).
"""


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
