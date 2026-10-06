# AdaptIQ — Demo Walkthrough (3-4 min)

Run order matches the SoP story: static exams → BKT/adaptive → analytics.
Story IDs (US1-US8) match the finalized SoP; see `EXECUTION_PLAN.md` for
ownership.

## Before the review (2 min)

```bash
git pull && ./start.sh        # Windows: inside Git Bash
```

Open http://localhost:5173. `start.sh` resets the database on every run, so
the demo always starts from the same state:

- Teacher `demo.teacher@adaptiq.test`, password `Demo1234!`
- 12 students (`ananya`, `rohit`, `meera`, ... `.demo@adaptiq.test`, same
  password), each with 3-4 quiz sessions over the last two weeks
- A published **"Live Demo Quiz"** covering all 6 concepts
- Class report: Graphs and Trees below 60% (red), Arrays/Stacks/Queues/Linked
  Lists above it

Rehearse once, then run `./start.sh` again right before presenting to get a
clean database. If you're already logged in from a previous run, click
**Log out** first.

## 1. Problem framing (30 sec)
"A fixed quiz treats every student the same — the same questions, in the
same order, regardless of what they already know. AdaptIQ instead estimates
a student's mastery *per concept* using Bayesian Knowledge Tracing, and picks
each next question based on that estimate."

## 2. Teacher side (60 sec)
- Log in as `demo.teacher@adaptiq.test` / `Demo1234!`.
- **Class Weak-Concept Report** (top of the dashboard): Graphs and Trees are
  red, below 60% average mastery; Arrays and Stacks are 80%+. This is real
  per-concept data aggregated across 12 students, not an overall score (US7).
- **Add Question** form: concept- and difficulty-tagged question bank (US1).
- **Create Quiz**: "Live Demo Quiz" is already published (listed under the
  form). Optionally publish another one live to show it (US2).

## 3. Student side, live (90 sec) — the centerpiece
- Log out, log in as `ananya.demo@adaptiq.test` / `Demo1234!` (or register a
  fresh student on stage — see the note below).
- The quiz picker shows **"Live Demo Quiz"** (selected by default). Keep
  **Adaptive** mode and click **Start Quiz**.
- Answer 3-4 questions. After each answer, point at
  "Mastery: X% → Y%": the estimate moves in real time (US5).
- How the next concept is chosen (US4): within a session no concept repeats;
  among the rest, AdaptIQ picks the one the student has practised least, and
  among those the one with the lowest mastery. So every concept gets
  evidence before any is drilled again.
- A freshly registered student has no history, so their first question is
  the concept with the lowest starting estimate (Graphs). That's a clean way
  to show "weakest first".

## 4. Mastery map (30 sec)
- **Mastery Map** in the nav: per-concept bar chart with real concept names.
- **Suggested Revision** lists every concept under 60% (US6).
- **History** (optional): past sessions, labeled "Quiz: Live Demo Quiz" or
  by date for open practice.

## 5. Research angle (45 sec)
Log back in as the teacher → **Research**:
- **Live attempts**: logged attempts and average mastery shift per answer,
  adaptive vs. random.
- **Simulated learners**: 30 simulated students with a known true mastery,
  run through both strategies with the same BKT engine (SoP objective #5).
  Be upfront if asked: switching to coverage-aware selection cut adaptive's
  error from 0.316 to 0.262, and adaptive now beats random on short quizzes
  (~12 questions), but random is still slightly ahead at 30 questions
  (0.245). One reason: the simulated students never learn, while BKT assumes
  they do. That's a real limitation and future-work item, not a bug (US8).
- **Pilot-study export**: the CSV download, for Pandas/Matplotlib analysis
  per the Research Plan.

## 6. Jira board (15 sec, optional)
Show the sprint board (SCRUM-18/19/21/22) moving through columns as evidence
of the Agile process.

## Fallback notes
- **Anything looks wrong**: Ctrl+C the terminal, run `./start.sh` again (under
  10 s once installed; the very first run takes a few minutes). It resets
  everything.
- **Stuck on a page / wrong user shown**: click **Log out** and log in again.
- **No bash available**: follow "Windows notes → PowerShell only" in the
  README.
- API docs for questions about the backend: http://localhost:8000/docs
