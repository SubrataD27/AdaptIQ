// SoP US3 (Annandita): student/teacher register + login
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, saveSession } from "../api/client";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const redirectByRole = (user) => navigate(user.role === "teacher" ? "/teacher" : "/quiz");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = mode === "login"
        ? await api.post("/auth/login", { email, password })
        : await api.post("/auth/register", { name, email, password, role });
      saveSession(res.data.access_token, res.data.user);
      redirectByRole(res.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <div className="page auth-page">
      <div className="card auth-card">
        <h2>AdaptIQ {mode === "login" ? "Login" : "Register"}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="form-stack">
          {mode === "register" && (
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {mode === "register" && (
            <label>
              Role
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </label>
          )}
          <button className="btn btn-primary" type="submit">
            {mode === "login" ? "Log in" : "Register"}
          </button>
        </form>
        <p className="auth-toggle">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button type="button" className="link-btn" onClick={toggleMode}>
            {mode === "login" ? "Register" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
