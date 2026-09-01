// US-08, US-14: adaptive vs. random selection comparison (research angle)
import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Research() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/analytics/adaptive-vs-random")
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load research data."));
  }, []);

  return (
    <div className="page">
      <h2>Adaptive vs. Random — Research Comparison</h2>
      <p className="muted">
        Does BKT-driven adaptive question selection extract more signal per question than
        random selection from the same bank? A larger average mastery shift per answer means
        each question moved the estimate further — i.e. was more informative.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      {data && (
        <div className="card">
          <table className="table">
            <thead>
              <tr><th>Mode</th><th>Attempts logged</th><th>Avg. mastery shift / answer</th></tr>
            </thead>
            <tbody>
              {["adaptive", "random"].map((mode) => (
                <tr key={mode}>
                  <td style={{ textTransform: "capitalize" }}>{mode}</td>
                  <td>{data[mode]?.n_attempts ?? 0}</td>
                  <td>
                    {data[mode]?.avg_mastery_shift_per_answer != null
                      ? data[mode].avg_mastery_shift_per_answer.toFixed(3)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
