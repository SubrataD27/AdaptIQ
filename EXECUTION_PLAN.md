# AdaptIQ — Full Feature Execution Plan

Source of truth for scope: the finalized Statement of Purpose / Project
Proposal (Member 1: Annandita Padhi, 23UG010928; Member 2: Subrata Dhibar,
23UG010914; Supervisor: Dr. A.V.S. Pavan Kumar, per the signed Annexure-B;
class teacher Ranjit Patnaik).

## Where the codebase actually stands (as of Phase D completion)

Verified working end-to-end (registered users, published and took a
quiz-scoped and an open-practice quiz live, ran the simulation both
standalone and via the API, hit every endpoint, checked 375px mobile
width):

- Auth: register/login for both roles, JWT, `/auth/me` — **done**
- Question bank: teacher can add concept + difficulty tagged MCQs — **done**
- Quiz entity (SoP US2): teacher publishes a quiz over a chosen concept
  subset, student picks it (or falls back to open-subject practice),
  attempts and history are labeled by quiz — **done**
- BKT engine: 4-parameter Bayes update + learning transition — **done**
- Adaptive selection: lowest-mastery concept, random-baseline mode, session
  never repeats a concept, optionally scoped to a published quiz — **done**
- Mastery map: per-concept chart + revision suggestions — **done**
- Teacher class weak-concept analytics — **done**
- Quiz history (supplementary, not one of the SoP's 8 core stories) — **done**
- Adaptive-vs-random comparison: live-attempt endpoint + simulated-learner
  endpoint/script + pilot CSV export, all surfaced on the Research page — **done**
- Demo data script (3 fake students, 8-10 answers each) + demo script — **done**
- Ownership comments reconciled to the SoP's US1-US8 numbering — **done**
- Mobile check at 375px: fixed navbar wrap and a hardcoded-width chart that
  overflowed — **done**

## Not built yet, required by the proposal's own scope

- **Question bank is far short of scope.** Proposal scope says 8-12 concepts
  and 150+ questions for the pilot subject. Currently 6 concepts / 18
  questions. See Phase C.
- **No hosted deployment.** Proposal mentions Render/Railway free tier.
  Currently local-only.
- **Adaptive selection strategy doesn't yet beat random on whole-profile
  accuracy in simulation** — see Phase D's findings below. Worth exploring
  as a follow-up (e.g. a coverage or uncertainty term in `select_next_concept`)
  before leaning on it too hard in the written report.

## Phase B — Close US2: real Quiz entity — **done**

Built: `Quiz` model (`id, subject, title, concept_ids_json, teacher_id,
is_active, created_at`, with a `concept_ids` list property over the JSON
column), `POST /quizzes` (teacher-only), `GET /quizzes?subject=`,
`GET /quizzes/active?subject=`. `next-question`/`submit-answer` accept an
optional `quiz_id` that restricts the concept pool and tags the resulting
`Attempt`; Quiz History labels a session `"Quiz: <title>"` when one was
used. Teacher Dashboard has a Create Quiz form (title + concept checklist);
Student Quiz has a picker (teacher-published quiz, defaulting to the most
recent, vs. open subject-wide practice) so the prior unrestricted flow
still works when no quiz has been published.

Not done as part of Phase B (out of the plan's original scope, worth
flagging for later): no class/section targeting on a quiz, no way to
deactivate/edit a published quiz once created, no quiz detail/edit page.

## Phase C — Expand the question bank to scope

1. Grow "Data Structures" from 6 to 8-12 concepts (candidates: Hashing,
   Sorting Algorithms, Recursion, Heaps).
2. Grow from 18 to 150+ real, reviewed questions, tagged with genuine
   difficulty levels rather than a uniform default.
3. Update `seed.py` to load from a structured data file (CSV/JSON) instead
   of inline Python tuples.

**Content authoring is a research-integrity concern (bad questions distort
the BKT parameters), so flag drafts back to the team for review rather than
bulk-generating and seeding directly.**

## Phase D — Research component: simulation + pilot tooling — **done**

Built: `backend/app/simulation.py` — simulated students with a randomized
ground-truth mastery per concept, run through both adaptive and random
selection using the live BKT engine and each concept's real parameters,
tracking mean absolute error and questions-to-convergence (avg error <=0.1
sustained for 3 questions) per mode. Runnable standalone
(`python -m app.simulation [--students N] [--questions N] [--seed N]`) or
via `GET /analytics/simulation`. `GET /analytics/export-attempts` streams
every logged attempt as CSV for Pandas/Matplotlib. The Research page now
shows live attempts, the simulation comparison, and a CSV download link.

**Finding worth flagging to the team**: across multiple seeds/budgets, the
simulation consistently shows *random* selection with a lower mean absolute
error and better convergence than the current adaptive strategy. The
`select_next_concept` logic always drills whichever concept has the
current-lowest estimate; that concept's estimate gets refined fast, but
concepts it never revisits stay stuck at `p_init`, which hurts *whole-profile*
accuracy within a fixed question budget — even though it's still doing its
job of targeting the weakest concept locally. This is a legitimate,
reproducible result (not a simulation bug — see the Research page's
in-app note), and squarely the kind of "discussion of limitations and
future scope" objective #5 asks for. Options if the team wants adaptive to
win this metric before the write-up: add a coverage/round-robin fallback
so under-visited concepts get revisited periodically, or weight selection
by estimate *uncertainty* rather than raw value.

## Reference: Technology stack check against proposal

| Proposal says | Current code | Notes |
|---|---|---|
| React.js, mobile-responsive | React.js, verified at 375px | Phase A fix applied |
| FastAPI + JWT | FastAPI + JWT | Matches |
| pyBKT + NumPy | Custom Python BKT formula | Proposal allows "pyBKT/custom" — valid, don't rebuild unless Phase D wants pyBKT's parameter-fitting |
| PostgreSQL (SQLite dev) | SQLite only | Fine for now; switch the one `DATABASE_URL` line before any real pilot with concurrent users |
| Chart.js/Recharts | Recharts | Matches |
| Render/Railway hosted demo | Local only | Add if a shareable link is wanted |
