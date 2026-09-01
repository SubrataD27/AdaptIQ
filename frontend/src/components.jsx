import { Link, Navigate, useNavigate } from "react-router-dom";
import { clearSession, getUser } from "./api/client";

export function Navbar() {
  const user = getUser();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">AdaptIQ</div>
      <div className="navbar-links">
        {user.role === "student" && (
          <>
            <Link to="/quiz">Quiz</Link>
            <Link to="/mastery">Mastery Map</Link>
            <Link to="/history">History</Link>
          </>
        )}
        {user.role === "teacher" && (
          <>
            <Link to="/teacher">Dashboard</Link>
            <Link to="/research">Research</Link>
          </>
        )}
      </div>
      <div className="navbar-user">
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
