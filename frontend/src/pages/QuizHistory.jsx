// US-04: quiz history for students, grouped by session/date
import { useEffect, useState } from "react";
import { api, getUser } from "../api/client";

export default function QuizHistory() {
  const user = getUser();
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get(`/quiz/history/${user.id}`)
      .then((res) => setSessions(res.data))
      .catch(() => setError("Failed to load quiz history."))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="page">
      <h2>Quiz History</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {loaded && sessions.length === 0 && !error && (
        <p className="muted">No quiz sessions yet — take a quiz to build your history.</p>
      )}
      {sessions.map((s) => (
        <div className="card" key={s.date}>
          <h3>{s.date} — {s.correct}/{s.total} correct</h3>
          <table className="table">
            <thead><tr><th>Concept</th><th>Mode</th><th>Result</th></tr></thead>
            <tbody>
              {s.attempts.map((a, i) => (
                <tr key={i}>
                  <td>{a.concept}</td>
                  <td style={{ textTransform: "capitalize" }}>{a.mode}</td>
                  <td className={a.is_correct ? "text-correct" : "text-incorrect"}>
                    {a.is_correct ? "Correct" : "Incorrect"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
