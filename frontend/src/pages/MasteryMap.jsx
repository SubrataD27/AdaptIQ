// US-10, US-11: concept-wise mastery map + revision suggestions
import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { api, getUser } from "../api/client";

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
        const merged = masteryRes.data.map((d) => ({
          ...d,
          concept: conceptNames[d.concept_id] || `Concept ${d.concept_id}`,
          mastery_pct: Math.round(d.p_mastery * 100),
        }));
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
          <BarChart width={640} height={320} data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="concept" angle={-20} textAnchor="end" interval={0} height={60} />
            <YAxis domain={[0, 1]} />
            <Tooltip formatter={(v) => `${Math.round(v * 100)}%`} />
            <Bar dataKey="p_mastery" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
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
