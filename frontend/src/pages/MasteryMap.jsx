// US-10, US-11: concept-wise mastery map + revision suggestions
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { api } from "../api/client";

export default function MasteryMap() {
  const [data, setData] = useState([]);
  const studentId = 1;

  useEffect(() => {
    api.get(`/quiz/mastery-map/${studentId}`).then((res) => setData(res.data));
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h3>Your Concept Mastery</h3>
      <BarChart width={550} height={300} data={data}>
        <XAxis dataKey="concept_id" /><YAxis domain={[0, 1]} /><Tooltip />
        <Bar dataKey="p_mastery" fill="#1F3864" />
      </BarChart>
      <ul>{data.filter((d) => d.needs_revision).map((d) => <li key={d.concept_id}>Revise concept {d.concept_id}</li>)}</ul>
    </div>
  );
}
