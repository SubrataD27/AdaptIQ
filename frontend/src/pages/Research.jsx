// SoP US8 (Subrata): adaptive vs. random selection comparison (research angle).
// Live-attempt table + simulated-learner comparison (SoP objective #5, Phase D)
// + a pilot-study CSV export.
import { useEffect, useState } from "react";
import { api } from "../api/client";

const API_BASE = "http://localhost:8000";

export default function Research() {
  const [live, setLive] = useState(null);
  const [liveError, setLiveError] = useState("");
  const [sim, setSim] = useState(null);
  const [simError, setSimError] = useState("");
  const [simLoading, setSimLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/adaptive-vs-random")
      .then((res) => setLive(res.data))
      .catch(() => setLiveError("Failed to load live comparison data."));

    api.get("/analytics/simulation", { params: { students: 30, questions: 30 } })
      .then((res) => setSim(res.data))
      .catch(() => setSimError("Failed to load the simulated-learner comparison."))
      .finally(() => setSimLoading(false));
  }, []);

  return (
    <div className="page">
      <h2>Adaptive vs. Random — Research Comparison</h2>
      <p className="muted">
        Does BKT-driven adaptive question selection extract more signal per question than
        random selection from the same bank? A larger average mastery shift per answer means
        each question moved the estimate further — i.e. was more informative.
      </p>

      <div className="card">
        <h3>Live attempts</h3>
        {liveError && <div className="alert alert-error">{liveError}</div>}
        {live && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Mode</th><th>Attempts logged</th><th>Avg. mastery shift / answer</th></tr>
              </thead>
              <tbody>
                {["adaptive", "random"].map((mode) => (
                  <tr key={mode}>
                    <td style={{ textTransform: "capitalize" }}>{mode}</td>
                    <td>{live[mode]?.n_attempts ?? 0}</td>
                    <td>
                      {live[mode]?.avg_mastery_shift_per_answer != null
                        ? live[mode].avg_mastery_shift_per_answer.toFixed(3)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Simulated learners</h3>
        <p className="muted">
          SoP objective #5: 30 simulated students, each with a known ground-truth mastery per
          concept, answering 30 questions under each strategy. Measures how close the BKT
          estimate ends up to the true mastery (mean absolute error) and how many questions it
          took to get within 0.1 of it and stay there (questions-to-convergence).
        </p>
        {simError && <div className="alert alert-error">{simError}</div>}
        {simLoading && !simError && <p className="muted">Running simulation…</p>}
        {sim && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Mode</th><th>Mean |error|</th><th>% converged</th><th>Mean questions to converge</th></tr>
                </thead>
                <tbody>
                  {["adaptive", "random"].map((mode) => (
                    <tr key={mode}>
                      <td style={{ textTransform: "capitalize" }}>{mode}</td>
                      <td>{sim[mode]?.mean_absolute_error?.toFixed(3) ?? "—"}</td>
                      <td>{sim[mode]?.pct_converged ?? 0}%</td>
                      <td>{sim[mode]?.mean_questions_to_convergence ?? "n/a"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sim.adaptive && sim.random && sim.adaptive.mean_absolute_error > sim.random.mean_absolute_error && (
              <p className="muted" style={{ marginTop: 12 }}>
                Note: in this simulation, adaptive selection's error is currently higher than
                random's. The current strategy always targets whichever concept has the lowest
                estimate, which refines that one concept quickly but leaves others at their
                initial estimate if it never revisits them — hurting whole-profile accuracy
                within a fixed question budget. That's a legitimate finding worth including in
                the write-up's limitations/future-scope discussion (e.g. adding a coverage or
                uncertainty term to selection), not a bug in this simulation.
              </p>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h3>Pilot-study export</h3>
        <p className="muted">
          Every logged attempt (student, concept, quiz, mode, correctness, mastery before/after,
          timestamp) as CSV, for analysis in Pandas/Matplotlib per the SoP's Research Plan.
        </p>
        <a className="btn" href={`${API_BASE}/analytics/export-attempts`}>Download CSV</a>
      </div>
    </div>
  );
}
