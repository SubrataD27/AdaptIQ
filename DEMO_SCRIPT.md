# AdaptIQ — Demo Walkthrough (4-5 min)

Run order matches the SoP story: static exams → BKT/adaptive → analytics.
Story IDs (US1-US8) match the finalized SoP; see `EXECUTION_PLAN.md` for
ownership.

## Before the review (2 min)

```bash
git pull && ./start.sh        # Windows: inside Git Bash
```

The first run after a pull installs packages and builds the frontend (a few
minutes); later runs take about 10 seconds. Open http://localhost:5173.
`start.sh` resets the database on every run, so the demo always starts from
the same state:

- Teacher `demo.teacher@adaptiq.test`; 12 students (`ananya`, `rohit`,
  `meera`, ... `.demo@adaptiq.test`); every password is `Demo1234!`. The
  sign-in page lists these with one-click **Sign in** buttons.
- Each student has 3-4 quiz sessions over the last two weeks.
- **150 questions**: 10 concepts (Arrays … Recursion), each with 5 easy, 5 medium
  and 5 hard.
- A published **"Live Demo Quiz"** covers all 10 concepts.
- Class picture: Trees, Graphs, Heaps, Recursion and Queues below 60% (red);
  Arrays, Stacks, Hashing, Linked Lists and Sorting above it.

Rehearse once, then run `./start.sh` again right before presenting.

## 1. Problem framing — sign-in page (30 sec)
"A fixed quiz treats every student the same. AdaptIQ keeps a mastery
estimate per student, per concept, using Bayesian Knowledge Tracing, and uses
it to choose each next question."
Point at the **worked example** on the left: six answers on Trees and how the
estimate moves after each one. A wrong answer lowers it, a right one raises
it, allowing for lucky guesses and slips.

## 2. Teacher — Class overview (75 sec)
Click **Sign in** next to *Demo Teacher*.
- **Weak-concept report** (US7): average mastery per concept against the
  dashed 60% target. Graphs and Trees are the class's weak spots.
- **Mastery by student and concept** heatmap: one row per student, lowest
  average first, so the students who need help are at the top. Read across
  the top row to show *which* concepts that student needs help with, and the
  bottom "Class average" row for the class as a whole.
- **Class activity**: answers per day over the last two weeks.
- **Publish quiz** (US2): opens a dialog; "Live Demo Quiz" is already
  published. Optionally publish one live.
- **Question bank** (sidebar, US1): 150 questions, each tagged with concept
  and difficulty; filter by concept and by level; **Add question** opens a form.

## 3. Student — adaptive quiz, live (90 sec) — the centrepiece
Log out (bottom of the sidebar), then **Sign in** as *Ananya Rao*.
- The quiz picker has **Live Demo Quiz** selected; mode **Adaptive**.
  **Start quiz**.
- The right panel explains **why this concept** was chosen (US4): the one
  she has practised least, and among those the one she knows least. No
  concept repeats within a session.
- It also explains **why this difficulty** — the second level of
  adaptivity: below 40% mastery she gets an easy question, 40–70% medium,
  70% or more hard.
- Answer 3-4 questions. After each, the ring and the
  "X% → Y%" line show the BKT update live (US5).
- The quiz has 10 questions (one per concept); finish it, or stop after a few.
  The summary shows the score and how mastery moved on each concept.
- For a clean "weakest first" story, register a brand-new student instead:
  their first question is an **easy** Graphs question — the concept with the
  lowest starting estimate, at the level that matches it.

## 4. Mastery (30 sec)
**Mastery** in the sidebar (US6):
- **Mastery profile**: current estimate per concept against the 60% target.
- **Learning curves**: the estimate after every answer on each concept.
- **Suggested revision**: every concept under 60%.
- **History** (optional): score per session and each session's answers.

## 5. Research (45 sec)
Log back in as the teacher → **Research** (US8):
- **Estimation error vs. questions answered**: 30 simulated students with a
  known true mastery, run through the app's own BKT engine, adaptive vs.
  random, from 6 to 60 questions.
- Result: adaptive is more accurate than random on short and medium quizzes
  (12 and 30 questions, checked over 5 random seeds); at 60 questions it is a
  draw. Be upfront about the draw: the **Findings** card explains why
  (simulated learners don't learn, while BKT assumes they do). That's a real
  limitation and future-work item, not a bug.
- **Download CSV**: every logged answer, for Pandas/Matplotlib analysis per
  the Research Plan.

## 6. Jira board (15 sec, optional)
Show the sprint board (SCRUM-18/19/21/22) as evidence of the Agile process.

## Fallback notes
- **Anything looks wrong**: Ctrl+C the terminal and run `./start.sh` again.
  It resets everything.
- **Dark mode**: the moon icon at the bottom of the sidebar, if asked.
- **Phone**: the app works at phone width; the sidebar becomes a menu button.
- **No bash available**: follow "Windows notes → PowerShell only" in the
  README.
- API docs for backend questions: http://localhost:8000/docs
