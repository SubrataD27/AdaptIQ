"use client";
// Class weak-concept report + mastery heatmap: SoP US7 (Subrata). Publish quiz: SoP US2 (Annandita).
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup,
  Grid, Snackbar, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { api, errorMessage, getUser, pct, SUBJECT } from "@/lib/api";
import { ErrorAlert, LoadingBlock, MasteryLegend, Metric, PageHeader, Panel } from "@/components/ui";
import { CHART, MASTERY_THRESHOLD, masteryBin, MONO } from "@/theme";

const shortDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function PublishQuizDialog({ open, onClose, concepts, onCreated }) {
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setTitle(""); setSelected(concepts.map((c) => c.id)); setError(""); } }, [open, concepts]);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/quizzes/", { subject: SUBJECT, title, concept_ids: selected });
      onCreated(title);
    } catch (err) {
      setError(errorMessage(err, "Failed to publish the quiz."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { component: "form", onSubmit: submit } }}>
      <DialogTitle>Publish a quiz</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Students see published quizzes in their quiz picker. AdaptIQ orders the questions adaptively within the concepts you choose.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField label="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus
                   placeholder="e.g. Week 6 — Trees & Graphs" sx={{ mt: 1 }} />
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 0.5 }}>Concepts covered ({selected.length})</Typography>
        <FormGroup sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          {concepts.map((c) => (
            <FormControlLabel key={c.id} label={c.name}
                              control={<Checkbox size="small" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />} />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving || !selected.length || !title.trim()}>Publish quiz</Button>
      </DialogActions>
    </Dialog>
  );
}

function MasteryHeatmap({ roster, concepts, weak }) {
  const rows = [...roster].filter((s) => s.avg_mastery != null).sort((a, b) => a.avg_mastery - b.avg_mastery);
  const classAvg = Object.fromEntries((weak || []).map((c) => [c.concept_id, c.avg_mastery]));
  const cols = `minmax(130px, 1.4fr) repeat(${concepts.length}, minmax(64px, 1fr)) minmax(64px, 0.8fr)`;
  const Cell = ({ v, label }) => {
    if (v == null) return <Box sx={{ height: 34, borderRadius: "4px", bgcolor: "action.hover" }} />;
    const b = masteryBin(v);
    return (
      <Tooltip title={label} disableInteractive>
        <Box sx={{ height: 34, borderRadius: "4px", bgcolor: b.bg, color: b.fg, display: "grid", placeItems: "center",
                   fontFamily: MONO, fontSize: 12.5 }}>
          {Math.round(v * 100)}
        </Box>
      </Tooltip>
    );
  };
  return (
    <Box sx={{ overflowX: "auto", mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 } }}>
      <Box sx={{ minWidth: 130 + concepts.length * 68 + 70, display: "grid", gridTemplateColumns: cols, gap: "4px", alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Student</Typography>
        {concepts.map((c) => (
          <Typography key={c.id} variant="caption" color="text.secondary" align="center" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{c.name}</Typography>
        ))}
        <Typography variant="caption" color="text.secondary" align="center" sx={{ fontWeight: 600 }}>Avg</Typography>

        {rows.map((s) => (
          <Box key={s.student_id} sx={{ display: "contents" }}>
            <Box sx={{ minWidth: 0, pr: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{s.name}</Typography>
              <Typography variant="caption" color="text.secondary">{s.n_attempts} answers · {pct(s.accuracy)} correct</Typography>
            </Box>
            {concepts.map((c) => (
              <Cell key={c.id} v={s.mastery_by_concept?.[c.id]} label={`${s.name} · ${c.name}: ${pct(s.mastery_by_concept?.[c.id])}`} />
            ))}
            <Typography align="center" sx={{ fontFamily: MONO, fontSize: 13, fontWeight: 500,
                                             color: s.avg_mastery < MASTERY_THRESHOLD ? "error.main" : "text.primary" }}>
              {Math.round(s.avg_mastery * 100)}
            </Typography>
          </Box>
        ))}

        <Typography variant="body2" sx={{ fontWeight: 600, pt: 1, borderTop: 1, borderColor: "divider" }}>Class average</Typography>
        {concepts.map((c) => (
          <Box key={c.id} sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}>
            <Cell v={classAvg[c.id]} label={`Class · ${c.name}: ${pct(classAvg[c.id])}`} />
          </Box>
        ))}
        <Box sx={{ pt: 1, borderTop: 1, borderColor: "divider", height: "100%" }} />
      </Box>
    </Box>
  );
}

export default function ClassOverview() {
  const [user] = useState(getUser);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    const params = { params: { subject: SUBJECT } };
    Promise.all([
      api.get("/analytics/overview", params), api.get("/analytics/class-weak-concepts", params),
      api.get("/analytics/students", params), api.get("/analytics/activity", params),
      api.get("/quizzes/", params), api.get("/concepts/", params),
    ]).then(([o, w, s, a, q, c]) => setData({
      overview: o.data, weak: w.data, roster: s.data, activity: a.data, quizzes: q.data, concepts: c.data,
    })).catch((err) => setError(errorMessage(err, "Failed to load the class overview.")));
  }, []);

  useEffect(() => { load(); }, [load]);

  const recentAnswers = useMemo(() => (data ? data.activity.reduce((s, d) => s + d.answers, 0) : null), [data]);
  const weakCount = data ? data.weak.filter((c) => c.avg_mastery < MASTERY_THRESHOLD).length : 0;
  const o = data?.overview;

  return (
    <>
      <PageHeader eyebrow="Class overview" title={SUBJECT}
                  subtitle={`Signed in as ${user?.name ?? ""}. Every number here comes from answers students have submitted.`}
                  action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialogOpen(true)}>Publish quiz</Button>} />
      <ErrorAlert error={error} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, lg: 3 }}>
          <Metric label="Students" value={o?.n_students} hint={o && `${o.n_active_students} have answered`} />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }}>
          <Metric label="Recent answers" value={recentAnswers}
                  hint="last 14 days"
                  aside={data && (
                    <Box sx={{ display: { xs: "none", sm: "block" } }}>
                      <SparkLineChart data={data.activity.map((d) => d.answers)} height={40} plotType="bar" color={CHART.primary} />
                    </Box>
                  )} />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }}>
          <Metric label="Class accuracy" value={o && pct(o.accuracy)} hint="share of answers correct" />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }}>
          <Metric label="Average mastery" value={o && pct(o.avg_mastery)}
                  tone={o && o.avg_mastery < MASTERY_THRESHOLD ? "error" : undefined}
                  hint={data && `${weakCount} of ${data.weak.length} concepts below 60%`} />
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel title="Weak-concept report" subtitle="Average BKT mastery per concept across the class, weakest first">
            {!data ? <LoadingBlock height={280} /> : data.weak.length === 0 ? (
              <Typography color="text.secondary">No answers logged yet.</Typography>
            ) : (
              <BarChart height={Math.max(220, data.weak.length * 44 + 50)} layout="horizontal" margin={{ left: 0, right: 28, top: 8 }}
                        dataset={data.weak.map((c) => ({ concept: c.concept, mastery: Math.round(c.avg_mastery * 100) }))}
                        yAxis={[{ scaleType: "band", dataKey: "concept", width: 92, categoryGapRatio: 0.35 }]}
                        xAxis={[{ min: 0, max: 100, valueFormatter: (v) => `${v}%`,
                                  colorMap: { type: "piecewise", thresholds: [60], colors: [CHART.weak, CHART.good] } }]}
                        series={[{ dataKey: "mastery", label: "Average mastery", valueFormatter: (v) => `${v}%` }]}
                        hideLegend grid={{ vertical: true }}>
                <ChartsReferenceLine x={60} label="60% target" labelAlign="start"
                                     lineStyle={{ stroke: "#64748b", strokeDasharray: "4 4" }}
                                     labelStyle={{ fontSize: 11, fill: "#64748b" }} />
              </BarChart>
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel title="Class activity" subtitle="Answers submitted per day, last 14 days">
            {!data ? <LoadingBlock height={280} /> : (
              <BarChart height={Math.max(220, data.weak.length * 44 + 50)} margin={{ left: 0, right: 8, top: 8 }}
                        xAxis={[{ scaleType: "band", data: data.activity.map((d) => shortDay(d.day)), tickLabelInterval: (_, i) => (data.activity.length - 1 - i) % 3 === 0 }]}
                        yAxis={[{ width: 34 }]}
                        series={[{ data: data.activity.map((d) => d.answers), label: "Answers", color: CHART.primary,
                                   valueFormatter: (v, { dataIndex }) => {
                                     const d = data.activity[dataIndex];
                                     return d.answers ? `${v} answers · ${pct(d.accuracy)} correct · ${d.active_students} students` : "no activity";
                                   } }]}
                        hideLegend grid={{ horizontal: true }} />
            )}
          </Panel>
        </Grid>

        <Grid size={12}>
          <Panel title="Mastery by student and concept"
                 subtitle="Each cell is the student's current BKT mastery (%). Lowest average first, so the students who need help are at the top."
                 action={<MasteryLegend />}>
            {!data ? <LoadingBlock height={360} /> : <MasteryHeatmap roster={data.roster} concepts={data.concepts} weak={data.weak} />}
          </Panel>
        </Grid>

        <Grid size={12}>
          <Panel title="Published quizzes" subtitle="Visible to every student in their quiz picker"
                 action={<Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setDialogOpen(true)}>New quiz</Button>}>
            {!data ? <LoadingBlock height={80} /> : data.quizzes.length === 0 ? <Typography color="text.secondary">No quizzes yet.</Typography> : (
              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" } }}>
                {data.quizzes.map((q) => (
                  <Stack key={q.id} direction="row" spacing={1.5} sx={{ alignItems: "center", p: 1.5, border: 1, borderColor: "divider", borderRadius: "6px" }}>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{q.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {q.concept_ids.length === data.concepts.length ? "All concepts" : q.concept_ids.map((id) => data.concepts.find((c) => c.id === id)?.name).join(", ")}
                      </Typography>
                    </Box>
                    {q.is_active && <Chip size="small" label="Live" color="success" variant="outlined" />}
                  </Stack>
                ))}
              </Box>
            )}
          </Panel>
        </Grid>
      </Grid>

      <PublishQuizDialog open={dialogOpen} onClose={() => setDialogOpen(false)} concepts={data?.concepts || []}
                         onCreated={(title) => { setDialogOpen(false); setToast(`"${title}" published`); load(); }} />
      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast("")} message={toast}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />
    </>
  );
}
