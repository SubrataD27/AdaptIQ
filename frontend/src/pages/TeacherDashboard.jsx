// US-03, US-04, US-12, US-15: question bank + class analytics
import { useEffect, useState } from "react";
import { api } from "../api/client";

const SUBJECT = "Data Structures";
const EMPTY_FORM = {
  concept_id: "", text: "", option_a: "", option_b: "", option_c: "", option_d: "",
  correct_option: "a", difficulty: "medium",
};

export default function TeacherDashboard() {
  const [weakConcepts, setWeakConcepts] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWeakConcepts = () => {
    api.get("/analytics/class-weak-concepts", { params: { subject: SUBJECT } })
      .then((res) => setWeakConcepts(res.data))
      .catch(() => setError("Failed to load the class weak-concept report."));
  };

  useEffect(() => {
    loadWeakConcepts();
    api.get("/concepts/", { params: { subject: SUBJECT } }).then((res) => {
      setConcepts(res.data);
      setForm((f) => ({ ...f, concept_id: res.data[0]?.id ?? "" }));
    });
  }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submitQuestion = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/questions/", { ...form, concept_id: Number(form.concept_id) });
      setSuccess("Question added to the bank.");
      setForm((f) => ({ ...EMPTY_FORM, concept_id: f.concept_id, difficulty: f.difficulty }));
      loadWeakConcepts();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add question.");
    }
  };

  return (
    <div className="page">
      <h2>Teacher Dashboard</h2>

      <div className="card">
        <h3>Class Weak-Concept Report</h3>
        {weakConcepts.length === 0 ? (
          <p className="muted">No student attempts logged yet for {SUBJECT}.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Concept</th><th>Avg. Mastery</th></tr></thead>
            <tbody>
              {weakConcepts.map((c) => (
                <tr key={c.concept_id} className={c.avg_mastery < 0.6 ? "row-weak" : ""}>
                  <td>{c.concept}</td>
                  <td>{(c.avg_mastery * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Add Question</h3>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={submitQuestion} className="form-grid">
          <label>
            Concept
            <select value={form.concept_id} onChange={handleChange("concept_id")} required>
              {concepts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>
            Difficulty
            <select value={form.difficulty} onChange={handleChange("difficulty")}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className="span-2">
            Question text
            <input value={form.text} onChange={handleChange("text")} required />
          </label>
          <label>Option A<input value={form.option_a} onChange={handleChange("option_a")} required /></label>
          <label>Option B<input value={form.option_b} onChange={handleChange("option_b")} required /></label>
          <label>Option C<input value={form.option_c} onChange={handleChange("option_c")} required /></label>
          <label>Option D<input value={form.option_d} onChange={handleChange("option_d")} required /></label>
          <label>
            Correct option
            <select value={form.correct_option} onChange={handleChange("correct_option")}>
              <option value="a">A</option>
              <option value="b">B</option>
              <option value="c">C</option>
              <option value="d">D</option>
            </select>
          </label>
          <button className="btn btn-primary span-2" type="submit">Add Question</button>
        </form>
      </div>
    </div>
  );
}
