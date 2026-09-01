// US-01, US-02: teacher/student register + login
import { useState } from "react";
import { api } from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await api.post("/auth/login", null, { params: { email, password } });
    localStorage.setItem("token", res.data.access_token);
  };

  return (
    <div style={{ maxWidth: 320, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h2>AdaptIQ Login</h2>
      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Log in</button>
    </div>
  );
}
