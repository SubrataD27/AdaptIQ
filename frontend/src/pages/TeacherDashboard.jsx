// US-03, US-04, US-12, US-15: question bank + class analytics
import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function TeacherDashboard() {
  const [weakConcepts, setWeakConcepts] = useState([]);

  useEffect(() => {
    api.get("/analytics/class-weak-concepts", { params: { subject: "Data Structures" } })
      .then((res) => setWeakConcepts(res.data));
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h3>Class Weak-Concept Report</h3>
      <ul>{weakConcepts.map((c) => <li key={c.concept_id}>{c.concept}: avg mastery {c.avg_mastery.toFixed(2)}</li>)}</ul>
    </div>
  );
}
