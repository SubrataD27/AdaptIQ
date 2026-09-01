# AdaptIQ — Demo Walkthrough (3-4 min)

Run order matches the SoP story: static exams → BKT/adaptive → analytics.
Story IDs below (US1-US8) match the finalized SoP; see `EXECUTION_PLAN.md`
for the full ownership mapping.

Before the review: start the backend (`uvicorn app.main:app --reload` from
`backend/`, inside `venv`) and the frontend (`npm run dev` from `frontend/`).
Demo accounts are already seeded — see `backend/app/demo_data.py`
(`python -m app.demo_data` to reseed if the db is reset). The seeded demo
students have no published quiz on their accounts yet, so the student quiz
picker will default to "Practice — whole subject" until you publish one live
in step 2.

## 1. Problem framing (30 sec)
"A fixed quiz treats every student the same — the same questions, in the
same order, regardless of what they already know. AdaptIQ instead estimates
a student's mastery *per concept* using Bayesian Knowledge Tracing, and picks
each next question to target the concept they're weakest on."

## 2. Teacher side (60 sec)
- Log in as the teacher account.
- Show the **Add Question** form briefly — concept-tagged, difficulty-tagged
  question bank (US1).
- Publish a **Quiz** covering all 6 concepts (title it something like
  "Live Demo Quiz", check every concept box, Publish). This is what makes
  the quiz picker show a real teacher-shared quiz on the student side in
  step 3, not just open practice (US2).
- Show the **Class Weak-Concept Report** — with the seeded demo data, Trees
  and Graphs sit around 30-35% average mastery while Arrays sits near 60%+.
  Point out this is real, aggregated per-concept data across multiple
  students, not just an overall score (US7).

## 3. Student side, live (90 sec) — the centerpiece
- Log in as the real demo student account (or register fresh on stage).
- On the quiz page, the picker now shows "Live Demo Quiz" — select it (or
  leave it selected, since the most recent published quiz is the default)
  and start in **Adaptive** mode.
- Answer 3-4 questions live. After each answer, point at the
  "Mastery: X% → Y%" line — the number visibly moves in real time (US5).
- Call out that the concept behind each question was chosen because it was
  the student's current weakest — not random (US4).

## 4. Mastery map (30 sec)
- Navigate to **Mastery Map**. Show the bar chart with real concept names.
- Point at the revision suggestions list for anything under 60% mastery
  (US6).

## 5. Research angle (30 sec)
- Navigate to **Research** (teacher nav). Show the adaptive vs. random
  comparison table — attempts logged and average mastery shift per answer
  for each mode.
- Tie back to objective #5 in the SoP: this is the seed of the quantified
  adaptive-vs-random comparison the research component will formalize with
  simulated learners and a pilot study once Phase D lands (US8).

## 6. Jira board (15 sec, optional)
- Show the Sprint board with stories moving through columns as evidence of
  the Agile process.

## Fallback notes
- If live typing is slow, the 3 seeded fake students
  (`ananya.demo@adaptiq.test`, `rohit.demo@adaptiq.test`,
  `meera.demo@adaptiq.test` — password `Demo1234!`) already have 8-10
  answered questions each, so the weak-concept table and mastery map never
  look empty even before the live portion. They have no quiz tied to their
  attempts (open-subject practice), which is fine — it's still real BKT
  data.
- If you skip publishing a quiz in step 2, the student quiz picker falls
  back to "Practice — whole subject" automatically — the adaptive flow
  still works identically, just not scoped to a named quiz. Either path is
  fine for the demo; publishing a quiz just also demonstrates US2.
- Quiz History (`/history`, student nav) is available if asked about past
  session tracking — labels sessions by quiz title when one was used,
  otherwise by date. It's supplementary, not one of the SoP's 8 core
  stories.
