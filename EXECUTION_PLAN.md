# AdaptIQ — Full Feature Execution Plan

Source of truth for scope: the finalized Statement of Purpose / Project
Proposal (Member 1: Annandita Padhi, 23UG010928; Member 2: Subrata Dhibar,
23UG010914; Supervisor: Dr. A.V.S. Pavan Kumar, per the signed Annexure-B;
class teacher Ranjit Patnaik).

## Where the codebase actually stands (as of Phase A completion)

Verified working end-to-end (registered users, took a live quiz, hit every
endpoint, checked 375px mobile width):

- Auth: register/login for both roles, JWT, `/auth/me` — **done**
- Question bank: teacher can add concept + difficulty tagged MCQs — **done**
- BKT engine: 4-parameter Bayes update + learning transition — **done**
- Adaptive selection: lowest-mastery concept, random-baseline mode, session
  never repeats a concept — **done**
- Mastery map: per-concept chart + revision suggestions — **done**
- Teacher class weak-concept analytics — **done**
- Quiz history (supplementary, not one of the SoP's 8 core stories) — **done**
- Adaptive-vs-random comparison endpoint + Research page — **done**
- Demo data script (3 fake students, 8-10 answers each) + demo script — **done**
- Ownership comments reconciled to the SoP's US1-US8 numbering — **done**
- Mobile check at 375px: fixed navbar wrap and a hardcoded-width chart that
  overflowed — **done**

## Not built yet, required by the proposal's own scope

- **No discrete Quiz entity.** SoP US2 is "teacher creates a quiz for a
  subject and shares it with a class" — right now there's no quiz to create;
  students just pull questions by subject. Needs a `Quiz` model (subject,
  concept range, published/active flag, class/section) and a teacher
  "create quiz" flow. See Phase B.
- **Question bank is far short of scope.** Proposal scope says 8-12 concepts
  and 150+ questions for the pilot subject. Currently 6 concepts / 18
  questions. See Phase C.
- **No simulated-learner framework.** Objective #5 and the Research Plan's
  simulation study doesn't exist. `/analytics/adaptive-vs-random` only
  reports on real logged attempts, which is thin early on. See Phase D.
- **No pilot-study tooling.** Nothing to run/export a real class-section
  pilot session in bulk. See Phase D.
- **No hosted deployment.** Proposal mentions Render/Railway free tier.
  Currently local-only.

## Phase B — Close US2: real Quiz entity

1. Add a `Quiz` model: `id, subject, title, concept_ids (list), teacher_id,
   is_active, created_at`.
2. Teacher endpoints: `POST /quizzes` (create), `GET /quizzes?subject=`
   (list).
3. Student endpoint: `GET /quizzes/active?subject=`.
4. `next-question`/`submit-answer` gain an optional `quiz_id` so attempts
   group per quiz session, and Quiz History can show "Quiz: <title>"
   instead of just a date bucket.
5. Frontend: a "Create Quiz" form on the Teacher Dashboard, and Student Quiz
   picks from active quizzes instead of hardcoding `SUBJECT`.

**Coordinate with Annandita before starting — it's her module (US1-3, US6)
and a schema change.**

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

## Phase D — Research component: simulation + pilot tooling

1. `backend/app/simulation.py`: simulated students with a ground-truth
   mastery vector per concept, run both adaptive and random selection over
   many questions, track questions-to-convergence and mean absolute error
   per mode, runnable standalone (`python -m app.simulation`).
2. Pilot-study export: endpoint/script to export real quiz session data as
   CSV for Pandas/Matplotlib analysis.
3. Extend `/analytics/adaptive-vs-random` and the Research page to surface
   simulation results alongside live-attempt numbers.

**Subrata's module (US7-8) — safe to build independently once Phase A is
stable.**

## Reference: Technology stack check against proposal

| Proposal says | Current code | Notes |
|---|---|---|
| React.js, mobile-responsive | React.js, verified at 375px | Phase A fix applied |
| FastAPI + JWT | FastAPI + JWT | Matches |
| pyBKT + NumPy | Custom Python BKT formula | Proposal allows "pyBKT/custom" — valid, don't rebuild unless Phase D wants pyBKT's parameter-fitting |
| PostgreSQL (SQLite dev) | SQLite only | Fine for now; switch the one `DATABASE_URL` line before any real pilot with concurrent users |
| Chart.js/Recharts | Recharts | Matches |
| Render/Railway hosted demo | Local only | Add before Phase D if a shareable link is wanted |
