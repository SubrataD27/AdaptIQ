// SoP US6 (Annandita): concept-wise mastery map + revision suggestions
// (reassigned from the adaptive-engine epic to match the finalized SoP — no logic change)
import { useEffect, useState } from "react";
import { api, getUser } from "../api/client";
import { MasteryRing } from "../components.jsx";

const SUBJECT = "Data Structures";

export default function MasteryMap() {
  const user = getUser();
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [masteryRes, conceptsRes] = await Promise.all([
          api.get(`/quiz/mastery-map/${user.id}`),
          api.get("/concepts/", { params: { subject: SUBJECT } }),
        ]);
        const conceptNames = Object.fromEntries(conceptsRes.data.map((c) => [c.id, c.name]));
        const merged = masteryRes.data
          .map((d) => ({
            ...d,
            concept: conceptNames[d.concept_id] || `Concept ${d.concept_id}`,
            mastery_pct: Math.round(d.p_mastery * 100),
          }))
          .sort((a, b) => a.concept_id - b.concept_id);
        setData(merged);
      } catch {
        setError("Failed to load your mastery map.");
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  return (
    <div className="page">
      <h2>Your Concept Mastery</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {loaded && data.length === 0 && !error && (
        <p className="muted">No quiz attempts yet — take a quiz to see your mastery map.</p>
      )}
      {data.length > 0 && (
        <div className="card">
          <div className="ring-grid">
            {data.map((d) => <MasteryRing key={d.concept_id} value={d.p_mastery} label={d.concept} />)}
          </div>
          <p className="muted ring-legend">Green: mastered (60%+). Red: needs revision.</p>
        </div>
      )}
      {data.some((d) => d.needs_revision) && (
        <div className="card">
          <h3>Suggested Revision</h3>
          <ul>
            {data.filter((d) => d.needs_revision).map((d) => (
              <li key={d.concept_id}>{d.concept} — {d.mastery_pct}% mastery</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
