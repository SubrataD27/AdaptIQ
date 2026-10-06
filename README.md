# AdaptIQ — Adaptive Quizzing with Bayesian Knowledge Tracing

AdaptIQ estimates each student's mastery *per concept* with Bayesian Knowledge
Tracing (BKT) and picks the next quiz question to target what they don't know
yet. Teachers get a class-level weak-concept report; the Research page
compares adaptive vs. random question selection.

FastAPI + SQLite backend; Next.js 16 + Material UI frontend (MUI X Charts for the analytics).

## Quick start

```bash
git clone https://github.com/SubrataD27/AdaptIQ.git   # or: git pull
cd AdaptIQ
./start.sh                    # Windows: run this inside Git Bash
# open http://localhost:5173  and log in as demo.teacher@adaptiq.test / Demo1234!
# Ctrl+C stops both servers
```

Needs **Python 3.10–3.13** (3.12 recommended; 3.14 is not supported by the
pinned packages yet) and **Node.js 20.9+** (the current LTS is fine). Nothing else to install by hand.

`start.sh` does everything: creates `backend/venv`, installs Python and npm
dependencies, builds the Next.js frontend when its code changed (about a
minute the first time), stops anything already on ports 8000/5173, **deletes
and reseeds `backend/adaptiq.db`** (so every run starts from the same demo
state), starts both servers and opens the browser.

The login page lists the demo accounts with one-click **Sign in** buttons.

## Demo logins

All passwords: `Demo1234!`

| Role | Email |
|---|---|
| Teacher | `demo.teacher@adaptiq.test` |
| Student | `ananya.demo@adaptiq.test` |
| Student | `rohit.demo@adaptiq.test` |
| Student | `meera.demo@adaptiq.test` |

Nine more seeded students follow the same pattern (`arjun`, `priya`, `karan`,
`sneha`, `vikram`, `divya`, `aditya`, `ishita`, `rahul` + `.demo@adaptiq.test`).
The seed also creates a published **"Live Demo Quiz"** covering all 6
concepts, and ~2 weeks of quiz sessions per student, generated through the real
BKT update and adaptive selector (`backend/app/demo_data.py`).

See [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) for the rehearsed review walkthrough.

## Windows notes

- **Git Bash** (installed with Git for Windows) is the easiest option: open
  Git Bash in the repo folder and run `./start.sh`.
- **WSL** also works: run `./start.sh` inside WSL, then open
  http://localhost:5173 in your Windows browser.
- **PowerShell only** (no bash): run the same steps by hand, in two terminals:
  ```powershell
  # Terminal 1 — backend
  cd backend
  py -3.12 -m venv venv            # first time only
  .\venv\Scripts\pip install -r requirements.txt
  Remove-Item adaptiq.db -ErrorAction SilentlyContinue
  .\venv\Scripts\python -m app.demo_data
  .\venv\Scripts\python -m uvicorn app.main:app --port 8000

  # Terminal 2 — frontend
  cd frontend
  npm install                      # first time only
  npm run build                    # after every git pull
  npm start                        # serves on http://localhost:5173
  ```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Python 3.10-3.13 not found` | Install Python 3.12 from python.org (tick "Add to PATH"), reopen the terminal. |
| `backend/venv uses an unsupported Python` | Delete `backend/venv` and run `./start.sh` again. |
| `$'\r': command not found` | Old checkout with CRLF line endings: `git rm --cached -r . -q && git reset --hard` (discards local edits), then re-run. |
| Logged in as the wrong person after a restart | The DB is reset on every run; click **Log out** and log in again. |
| `Node.js ... is too old` | Install the Node.js LTS (20.9 or newer) from nodejs.org, reopen the terminal. |
| `frontend build failed` | Read `frontend/build.log`; usually fixed by deleting `frontend/node_modules` and re-running. |
| Backend/frontend "didn't come up" | Read `backend/uvicorn.log` or `frontend/next.log`. |

## What's built (finalized SoP US1–US8)

| Story | Owner | What it does |
|---|---|---|
| US1 | Annandita | 150-question bank (10 concepts, easy/medium/hard), filterable by concept and level, with an "Add question" dialog |
| US2 | Annandita | Teacher publishes a quiz over a chosen set of concepts; students pick it or practise the whole subject |
| US3 | Annandita | JWT register/login for teachers and students, role-based redirect |
| US4 | Subrata | Adaptive selection at two levels: which concept (least-practised, then weakest) and how hard (easy < 40% mastery, medium 40-70%, hard ≥ 70%) + random baseline mode |
| US5 | Subrata | 4-parameter BKT mastery update on every answer (`backend/app/bkt.py`) |
| US6 | Annandita | Per-student mastery profile, per-concept learning curves, revision suggestions (< 60% mastery) |
| US7 | Subrata | Class overview: weak-concept report, student × concept mastery heatmap, class activity |
| US8 | Subrata | Adaptive vs. random: simulated-learner error curve (6-60 questions), live-attempt stats, pilot-study CSV export |

Supplementary: quiz history page, startup seeding (10 concepts / 150 questions, 50 per difficulty level),
demo data generator. Roadmap and open items: [`EXECUTION_PLAN.md`](EXECUTION_PLAN.md).

## Useful commands (from `backend/`, venv active)

```bash
python -m app.demo_data      # seed demo teacher, quiz and class (idempotent)
python -m app.simulation     # adaptive vs. random simulated-learner comparison
```

API docs: http://localhost:8000/docs while the backend is running.

## Project layout

```text
backend/app/
  main.py            FastAPI app, CORS, startup seeding
  bkt.py             BKT update + adaptive concept selection
  seed.py            loads the question bank into the DB
  data/data_structures.json  10 concepts x 15 questions (5 easy, 5 medium, 5 hard)
  demo_data.py       demo teacher, Live Demo Quiz, seeded class
  simulation.py      simulated-learner research comparison
  routers/           auth, questions, quiz, quizzes, concepts, analytics
frontend/src/
  app/page.js        sign-in portal (demo accounts, worked BKT example)
  app/(app)/         quiz, mastery, history (student); teacher, questions, research (teacher)
  components/        app shell (sidebar, role guard), shared UI
  theme.js           MUI theme, chart colours, mastery bins
start.sh             one-command demo startup
```
