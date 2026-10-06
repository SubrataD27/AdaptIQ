import { NavLink, Navigate, useNavigate } from "react-router-dom";
import { clearSession, getUser } from "./api/client";

// Same threshold as the backend's needs_revision flag and the teacher report.
export const MASTERY_THRESHOLD = 0.6;

export function Navbar() {
  const user = getUser();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">AdaptIQ</div>
      <div className="sidebar-links">
        {user.role === "student" && (
          <>
            <NavLink to="/quiz">Quiz</NavLink>
            <NavLink to="/mastery">Mastery Map</NavLink>
            <NavLink to="/history">History</NavLink>
          </>
        )}
        {user.role === "teacher" && (
          <>
            <NavLink to="/teacher">Dashboard</NavLink>
            <NavLink to="/research">Research</NavLink>
          </>
        )}
      </div>
      <div className="sidebar-user">
        <span>{user.name} · {user.role}</span>
        <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}

export function RequireAuth({ children, role }) {
  const user = getUser();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

// Circular progress ring for a 0-1 mastery value; red below the revision threshold.
export function MasteryRing({ value, label, size = 96 }) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  const weak = value < MASTERY_THRESHOLD;

  return (
    <div className={`mastery-ring ${weak ? "mastery-ring-weak" : "mastery-ring-ok"}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
           aria-label={`${label ? label + ": " : ""}${pct}% mastery`}>
        <circle className="mastery-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className="mastery-ring-value"
          cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="mastery-ring-text">
          {pct}%
        </text>
      </svg>
      {label && <div className="mastery-ring-label">{label}</div>}
    </div>
  );
}
