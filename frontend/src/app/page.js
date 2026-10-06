"use client";
// SoP US3 (Annandita): student/teacher register + login, with one-click demo accounts for the review.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert, Box, Button, Card, CircularProgress, Divider, Grid, MenuItem, Stack, Tab, Tabs, TextField, Typography,
} from "@mui/material";
import { api, errorMessage, getUser, homeFor, saveSession } from "@/lib/api";
import { Logo } from "@/components/AppShell";
import { MONO } from "@/theme";

const DEMO_PASSWORD = "Demo1234!";
const DEMO_ACCOUNTS = [
  { role: "Teacher", name: "Demo Teacher", email: "demo.teacher@adaptiq.test" },
  { role: "Student", name: "Ananya Rao", email: "ananya.demo@adaptiq.test" },
  { role: "Student", name: "Rohit Verma", email: "rohit.demo@adaptiq.test" },
  { role: "Student", name: "Meera Iyer", email: "meera.demo@adaptiq.test" },
];

// Worked example: the same 4-parameter BKT update the backend runs (app/bkt.py),
// with the seeded "Trees" parameters, over one answer sequence.
const TREES = { pInit: 0.2, pLearn: 0.15, pSlip: 0.15, pGuess: 0.2 };
const ANSWERS = [false, true, true, false, true, true];
function bktTrace({ pInit, pLearn, pSlip, pGuess }, answers) {
  const out = [pInit];
  let p = pInit;
  for (const correct of answers) {
    const num = correct ? p * (1 - pSlip) : p * pSlip;
    const den = num + (correct ? (1 - p) * pGuess : (1 - p) * (1 - pGuess));
    const post = den > 0 ? num / den : p;
    p = post + (1 - post) * pLearn;
    out.push(p);
  }
  return out;
}
const TRACE = bktTrace(TREES, ANSWERS);

function TraceChart() {
  const W = 420, H = 150, PAD = { l: 34, r: 12, t: 12, b: 26 };
  const x = (i) => PAD.l + (i * (W - PAD.l - PAD.r)) / (TRACE.length - 1);
  const y = (v) => PAD.t + (1 - v) * (H - PAD.t - PAD.b);
  const path = TRACE.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <Box component="svg" viewBox={`0 0 ${W} ${H}`} sx={{ width: "100%", height: "auto", display: "block" }}
         role="img" aria-label="Mastery estimate after each answer in the worked example">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,.08)" />
          <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,.45)" fontFamily="IBM Plex Mono">
            {t * 100}%
          </text>
        </g>
      ))}
      <line x1={PAD.l} x2={W - PAD.r} y1={y(0.6)} y2={y(0.6)} stroke="rgba(127,199,154,.6)" strokeDasharray="4 4" />
      <text x={W - PAD.r} y={y(0.6) - 5} textAnchor="end" fontSize="10" fill="rgba(127,199,154,.9)">mastered ≥ 60%</text>
      <path d={path} fill="none" stroke="#8fb0ff" strokeWidth="2" />
      {TRACE.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="3.5" fill="#0f172a" stroke="#8fb0ff" strokeWidth="2" />
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fontFamily="IBM Plex Mono"
                fill={i === 0 ? "rgba(255,255,255,.45)" : ANSWERS[i - 1] ? "#7fc79a" : "#f08a96"}>
            {i === 0 ? "start" : ANSWERS[i - 1] ? "✓" : "✗"}
          </text>
        </g>
      ))}
    </Box>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (u) router.replace(homeFor(u));
  }, [router]);

  const signIn = async (email, password, key) => {
    setError("");
    setBusy(key);
    try {
      const res = await api.post("/auth/login", { email, password });
      saveSession(res.data.access_token, res.data.user);
      router.push(homeFor(res.data.user));
    } catch (err) {
      setError(errorMessage(err, "Invalid email or password."));
      setBusy(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (tab === "login") return signIn(form.email, form.password, "form");
    setError("");
    setBusy("form");
    try {
      const res = await api.post("/auth/register", form);
      saveSession(res.data.access_token, res.data.user);
      router.push(homeFor(res.data.user));
    } catch (err) {
      setError(errorMessage(err, "Couldn't create the account."));
      setBusy(null);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      {/* About panel */}
      <Grid size={{ xs: 12, md: 6 }}
            sx={{ order: { xs: 2, md: 1 }, bgcolor: "#0f172a", color: "#e5e7eb", px: { xs: 2.5, sm: 5, lg: 8 }, py: { xs: 5, md: 6 },
                  display: "flex", flexDirection: "column" }}>
        <Logo inverted size={30} />
        <Box sx={{ my: "auto", py: { xs: 4, md: 6 }, maxWidth: 520 }}>
          <Typography variant="h3" component="h1" sx={{ color: "#fff", fontSize: { xs: "1.8rem", sm: "2.3rem" }, lineHeight: 1.15 }}>
            Adaptive quizzing with Bayesian Knowledge Tracing
          </Typography>
          <Typography sx={{ mt: 2, color: "#a7b0c0", lineHeight: 1.65 }}>
            AdaptIQ keeps a mastery estimate for every student on every concept, updates it after each answer, and
            uses it to choose the next question. Teachers see where the class is weak; the research view compares
            adaptive selection against random.
          </Typography>

          <Box sx={{ mt: 4, p: { xs: 2, sm: 2.5 }, border: "1px solid rgba(255,255,255,.1)", borderRadius: "8px",
                     bgcolor: "rgba(255,255,255,.02)" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", mb: 1.5, gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: "#fff" }}>Worked example · Trees</Typography>
              <Typography variant="caption" sx={{ fontFamily: MONO, color: "#a7b0c0" }}>
                {Math.round(TRACE[0] * 100)}% → {Math.round(TRACE[TRACE.length - 1] * 100)}%
              </Typography>
            </Stack>
            <TraceChart />
            <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "#8b95a7", lineHeight: 1.6 }}>
              Six answers on one concept. A wrong answer lowers the estimate, a right one raises it, weighted by the
              chance of a lucky guess ({TREES.pGuess}) or a slip ({TREES.pSlip}), plus a learning step ({TREES.pLearn}) after each attempt.
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" sx={{ color: "#7c8697" }}>
          Annandita Padhi · Subrata Dhibar — Supervisor: Dr. A.V.S. Pavan Kumar
        </Typography>
      </Grid>

      {/* Sign-in */}
      <Grid size={{ xs: 12, md: 6 }}
            sx={{ order: { xs: 1, md: 2 }, display: "flex", alignItems: "center", justifyContent: "center", px: { xs: 2, sm: 4 }, py: { xs: 4, md: 6 },
                  bgcolor: "background.default" }}>
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          <Box sx={{ display: { md: "none" }, mb: 3 }}><Logo /></Box>
          <Typography variant="h4" component="h2">Sign in</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>Use your account, or one of the demo accounts below.</Typography>

          <Card sx={{ p: { xs: 2, sm: 3 } }}>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(""); }} sx={{ mb: 2.5, minHeight: 40 }}>
              <Tab label="Log in" value="login" sx={{ minHeight: 40 }} />
              <Tab label="Register" value="register" sx={{ minHeight: 40 }} />
            </Tabs>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack component="form" spacing={2} onSubmit={submit}>
              {tab === "register" && <TextField label="Full name" value={form.name} onChange={set("name")} required />}
              <TextField label="Email" type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
              <TextField label="Password" type="password" value={form.password} onChange={set("password")} required
                         autoComplete={tab === "login" ? "current-password" : "new-password"} />
              {tab === "register" && (
                <TextField select label="Role" value={form.role} onChange={set("role")}>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                </TextField>
              )}
              <Button type="submit" variant="contained" size="large" disabled={!!busy}>
                {busy === "form" ? <CircularProgress size={22} color="inherit" /> : tab === "login" ? "Log in" : "Create account"}
              </Button>
            </Stack>
          </Card>

          <Typography variant="subtitle2" sx={{ mt: 4, mb: 1 }}>Demo accounts</Typography>
          <Card>
            {DEMO_ACCOUNTS.map((a, i) => (
              <Box key={a.email}>
                {i > 0 && <Divider />}
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", px: 2, py: 1.25 }}>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {a.name} <Typography component="span" variant="caption" color="text.secondary">· {a.role}</Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: MONO, display: "block" }} noWrap>{a.email}</Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => signIn(a.email, DEMO_PASSWORD, a.email)}
                          disabled={!!busy} aria-label={`Sign in as ${a.name}`} sx={{ flexShrink: 0, minWidth: 76 }}>
                    {busy === a.email ? <CircularProgress size={16} /> : "Sign in"}
                  </Button>
                </Stack>
              </Box>
            ))}
          </Card>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.25, lineHeight: 1.6 }}>
            Password for every demo account: <Box component="span" sx={{ fontFamily: MONO, color: "text.primary" }}>{DEMO_PASSWORD}</Box>.
            Nine more students: arjun, priya, karan, sneha, vikram, divya, aditya, ishita, rahul (<Box component="span" sx={{ fontFamily: MONO }}>name.demo@adaptiq.test</Box>).
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
}
