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

- **Question bank content review.** The bank now meets the proposal's scope
  (10 concepts, 150 questions) — see Phase C — but the questions still need a
  read-through by both team members before any real pilot.
- **No hosted deployment.** Proposal mentions Render/Railway free tier.
  Currently local-only.
- **Adaptive vs. random on long quizzes is a draw in simulation.** Adaptive
  wins at 12 and 30 questions; at 60 it is level. See the 10-concept re-run
  under Phase D.
- **BKT parameters are hand-set**, not yet fitted from pilot data (pyBKT).

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

## Phase C — Expand the question bank to scope — **done**

1. Grow "Data Structures" from 6 to 8-12 concepts (candidates: Hashing,
   Sorting Algorithms, Recursion, Heaps).
2. Grow from 18 to 150+ real, reviewed questions, tagged with genuine
   difficulty levels rather than a uniform default.
3. Update `seed.py` to load from a structured data file (CSV/JSON) instead
   of inline Python tuples.

**Content authoring is a research-integrity concern (bad questions distort
the BKT parameters), so flag drafts back to the team for review rather than
bulk-generating and seeding directly.**

Built for Review 2: `backend/app/data/data_structures.json` — 10 concepts
(Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Hashing, Heaps, Sorting,
Recursion) x 15 questions, exactly 5 easy / 5 medium / 5 hard each, all
standard textbook facts with every answer checked. `seed.py` loads the file
and shuffles each question's options deterministically (seeded by the
question text) so correct answers are spread across A-D. **Still to do:** a
read-through by both team members before any real pilot, per the note above.

Difficulty is now used: in adaptive mode `bkt.select_question` serves an
easy question while the concept's mastery is below 40%, medium at 40-70%,
hard at 70%+ (nearest level if one is exhausted, least-seen first). Random
mode keeps choosing any question, so the research baseline stays random.

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

**SCRUM-22 update — coverage-aware selection.** `select_next_concept` now
takes per-concept attempt counts: among concepts not yet asked this session
it picks the least-practised ones first, then the lowest mastery among those.
The live quiz, the simulation and the demo-data generator all use it.
Uncertainty weighting (p(1-p)/(1+count)) was also tried and did not help.
Re-run of `python -m app.simulation` (30 students, mean absolute error):

| Setting | Adaptive (old) | Adaptive (coverage) | Random |
|---|---|---|---|
| 30 q, seed 42 (Research page) | 0.316 | 0.262 | 0.245 |
| 30 q, seed 1 | 0.317 | 0.278 | 0.231 |
| 30 q, seed 7 | 0.343 | 0.270 | 0.288 |
| 12 q, seed 42 | 0.267 | 0.226 | 0.245 |
| 60 q, seed 42 | 0.396 | 0.322 | 0.300 |

Adaptive error fell 15-21% everywhere and now beats random on short quizzes,
but random still wins at the default budget on 2 of 3 seeds. Error rises with
more questions for *every* strategy: simulated learners have a fixed true
mastery, while BKT's p_learn term assumes they learn after each answer, so
repeated observations push estimates upward. A simulation where learners also
learn (or fitted p_learn values from pilot data) is the next step before
claiming adaptive wins.

**Re-run on the 10-concept bank** (30 students, mean absolute error,
adaptive vs. random):

| Seed | 12 questions | 30 questions | 60 questions |
|---|---|---|---|
| 42 (Research page) | **0.216** vs 0.244 | **0.242** vs 0.253 | **0.268** vs 0.270 |
| 1 | **0.209** vs 0.237 | **0.228** vs 0.248 | **0.268** vs 0.271 |
| 7 | **0.226** vs 0.267 | **0.239** vs 0.242 | 0.296 vs **0.290** |
| 123 | 0.231 vs 0.231 | **0.235** vs 0.254 | 0.284 vs **0.269** |
| 2024 | **0.238** vs 0.250 | **0.245** vs 0.246 | 0.281 vs **0.267** |

With more concepts, coverage-aware adaptive selection beats random at 30
questions in all 5 seeds and at 12 in 4 (one tie); at 60 questions random is
ahead in 3 of 5, so long quizzes are a draw. Against the original
lowest-mastery-only rule (seed 42) the coverage rule cut error by 10-28%.

## Reference: Technology stack check against proposal

| Proposal says | Current code | Notes |
|---|---|---|
| React.js, mobile-responsive | Next.js 16 (React 19) + MUI 9, verified at 320-1440px | Rebuilt for Review 2 |
| FastAPI + JWT | FastAPI + JWT | Matches |
| pyBKT + NumPy | Custom Python BKT formula | Proposal allows "pyBKT/custom" — valid, don't rebuild unless Phase D wants pyBKT's parameter-fitting |
| PostgreSQL (SQLite dev) | SQLite only | Fine for now; switch the one `DATABASE_URL` line before any real pilot with concurrent users |
| Chart.js/Recharts | MUI X Charts | Equivalent charting library |
| Render/Railway hosted demo | Local only | Add if a shareable link is wanted |
