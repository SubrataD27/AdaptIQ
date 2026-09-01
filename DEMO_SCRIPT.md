# AdaptIQ — Demo Walkthrough (3-4 min)

Run order matches the SoP story: static exams → BKT/adaptive → analytics.

Before the review: start the backend (`uvicorn app.main:app --reload` from
`backend/`, inside `venv`) and the frontend (`npm run dev` from `frontend/`).
Demo accounts are already seeded — see `backend/app/demo_data.py`
(`python -m app.demo_data` to reseed if the db is reset).

## 1. Problem framing (30 sec)
"A fixed quiz treats every student the same — the same questions, in the
same order, regardless of what they already know. AdaptIQ instead estimates
a student's mastery *per concept* using Bayesian Knowledge Tracing, and picks
each next question to target the concept they're weakest on."

## 2. Teacher side (45 sec)
- Log in as the teacher account.
- Show the **Add Question** form briefly — concept-tagged, difficulty-tagged
  question bank (US-01).
- Show the **Class Weak-Concept Report** — with the seeded demo data, Trees
  and Graphs sit around 30-35% average mastery while Arrays sits near 60%+.
  Point out this is real, aggregated per-concept data across multiple
  students, not just an overall score (US-12).

## 3. Student side, live (90 sec) — the centerpiece
- Log in as the real demo student account (or register fresh on stage).
- Start the quiz in **Adaptive** mode.
- Answer 3-4 questions live. After each answer, point at the
  "Mastery: X% → Y%" line — the number visibly moves in real time (US-06,
  US-09).
- Call out that the concept behind each question was chosen because it was
  the student's current weakest — not random (US-07).

## 4. Mastery map (30 sec)
- Navigate to **Mastery Map**. Show the bar chart with real concept names.
- Point at the revision suggestions list for anything under 60% mastery
  (US-10, US-11).

## 5. Research angle (30 sec)
- Navigate to **Research** (teacher nav). Show the adaptive vs. random
  comparison table — attempts logged and average mastery shift per answer
  for each mode.
- Tie back to objective #6 in the SoP: this is the seed of the quantified
  adaptive-vs-random comparison the research component will formalize with
  simulated learners and a pilot study (US-08, US-14).

## 6. Jira board (15 sec, optional)
- Show the Sprint board with stories moving through columns as evidence of
  the Agile process.

## Fallback notes
- If live typing is slow, the demo student and 3 seeded fake students
  (`ananya.demo@adaptiq.test`, `rohit.demo@adaptiq.test`,
  `meera.demo@adaptiq.test` — password `Demo1234!`) already have 8-10
  answered questions each, so the weak-concept table and mastery map never
  look empty even before the live portion.
- Quiz History (`/history`, student nav) is available if asked about past
  session tracking (US-04).
