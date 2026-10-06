"use client";
// SoP US1 (Annandita): concept- and difficulty-tagged question bank.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, Chip, Dialog, Pagination, ToggleButton, ToggleButtonGroup, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Skeleton,
  Snackbar, Stack, TextField, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { api, errorMessage, SUBJECT } from "@/lib/api";
import { ErrorAlert, PageHeader } from "@/components/ui";
import { MONO } from "@/theme";

const LETTERS = ["a", "b", "c", "d"];
const PAGE_SIZE = 12;
const DIFFICULTY_COLOR = { easy: "success", medium: "warning", hard: "error" };
const EMPTY = { concept_id: "", text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "a", difficulty: "medium" };

function AddQuestionDialog({ open, onClose, concepts, defaultConcept, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setForm({ ...EMPTY, concept_id: defaultConcept || concepts[0]?.id || "" }); setError(""); }
  }, [open, concepts, defaultConcept]);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/questions/", { ...form, concept_id: Number(form.concept_id) });
      onCreated();
    } catch (err) {
      setError(errorMessage(err, "Failed to add the question."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" slotProps={{ paper: { component: "form", onSubmit: submit } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Add a question</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Concept" value={form.concept_id} onChange={set("concept_id")} required>
              {concepts.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Difficulty" value={form.difficulty} onChange={set("difficulty")}>
              <MenuItem value="easy">Easy</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="hard">Hard</MenuItem>
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField label="Question" value={form.text} onChange={set("text")} required multiline minRows={2} />
          </Grid>
          {LETTERS.map((l) => (
            <Grid key={l} size={{ xs: 12, sm: 6 }}>
              <TextField label={`Option ${l.toUpperCase()}`} value={form[`option_${l}`]} onChange={set(`option_${l}`)} required
                         color={form.correct_option === l ? "success" : "primary"} />
            </Grid>
          ))}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Correct option" value={form.correct_option} onChange={set("correct_option")}>
              {LETTERS.map((l) => <MenuItem key={l} value={l}>{l.toUpperCase()}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>Add to bank</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function QuestionBankPage() {
  const [concepts, setConcepts] = useState([]);
  const [questions, setQuestions] = useState(null);
  const [filter, setFilter] = useState("all");
  const [level, setLevel] = useState("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    Promise.all([api.get("/concepts/", { params: { subject: SUBJECT } }), api.get("/questions/")])
      .then(([c, q]) => {
        const ids = new Set(c.data.map((x) => x.id));
        setConcepts(c.data);
        setQuestions(q.data.filter((x) => ids.has(x.concept_id)));
      })
      .catch((err) => { setError(errorMessage(err, "Failed to load the question bank.")); setQuestions([]); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const conceptName = useMemo(() => Object.fromEntries(concepts.map((c) => [c.id, c.name])), [concepts]);
  const counts = useMemo(() => (questions || []).reduce((m, q) => ({ ...m, [q.concept_id]: (m[q.concept_id] || 0) + 1 }), {}), [questions]);
  const filtered = (questions || [])
    .filter((q) => (filter === "all" || q.concept_id === filter) && (level === "all" || q.difficulty === level))
    .slice().reverse();
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filter, level]);

  return (
    <>
      <PageHeader eyebrow={SUBJECT} title="Question bank"
                  subtitle={questions ? `${questions.length} questions across ${concepts.length} concepts · ${["easy", "medium", "hard"].map((d) => `${questions.filter((q) => q.difficulty === d).length} ${d}`).join(" · ")}. Adaptive quizzes pick the difficulty from each student's mastery.` : "Every question is tagged with a concept and a difficulty level."}
                  action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>Add question</Button>} />
      <ErrorAlert error={error} />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
        <ToggleButtonGroup size="small" exclusive value={level} onChange={(_, v) => v && setLevel(v)} color="primary">
          {["all", "easy", "medium", "hard"].map((d) => (
            <ToggleButton key={d} value={d} sx={{ px: 1.5, textTransform: "capitalize" }}>{d === "all" ? "All levels" : d}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} question{filtered.length === 1 ? "" : "s"}{pages > 1 ? ` · page ${page} of ${pages}` : ""}
        </Typography>
      </Stack>
      <Stack direction="row" sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Chip label={`All · ${questions?.length ?? 0}`} onClick={() => setFilter("all")}
              color={filter === "all" ? "primary" : "default"} variant={filter === "all" ? "filled" : "outlined"} />
        {concepts.map((c) => (
          <Chip key={c.id} label={`${c.name} · ${counts[c.id] || 0}`} onClick={() => setFilter(c.id)}
                color={filter === c.id ? "primary" : "default"} variant={filter === c.id ? "filled" : "outlined"} />
        ))}
      </Stack>

      {questions === null ? <Skeleton variant="rounded" height={300} /> : (
        <Grid container spacing={2}>
          {shown.map((q) => (
            <Grid key={q.id} size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: "100%", p: { xs: 2, sm: 2.5 } }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1.25, alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "primary.main" }}>{conceptName[q.concept_id]}</Typography>
                  <Typography variant="caption" color="text.secondary">·</Typography>
                  <Typography variant="caption" sx={{ textTransform: "capitalize", color: `${DIFFICULTY_COLOR[q.difficulty] || "text"}.main` }}>
                    {q.difficulty}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: MONO }}>#{q.id}</Typography>
                </Stack>
                <Typography sx={{ fontWeight: 500, mb: 1.5 }}>{q.text}</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                  {LETTERS.map((l) => {
                    const right = q.correct_option === l;
                    return (
                      <Stack key={l} direction="row" spacing={1} sx={{ alignItems: "center", px: 1.25, py: 0.75, borderRadius: "6px",
                                                                      border: 1, borderColor: right ? "success.main" : "divider",
                                                                      bgcolor: right ? "rgba(47,158,91,.06)" : "transparent" }}>
                        <Typography variant="body2" sx={{ fontFamily: MONO, textTransform: "uppercase", color: "text.secondary" }}>{l}</Typography>
                        <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0 }}>{q[`option_${l}`]}</Typography>
                        {right && <CheckCircleRoundedIcon color="success" fontSize="small" />}
                      </Stack>
                    );
                  })}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination count={pages} page={page} onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      color="primary" shape="rounded" siblingCount={0} />
        </Box>
      )}

      <AddQuestionDialog open={open} onClose={() => setOpen(false)} concepts={concepts}
                         defaultConcept={filter === "all" ? null : filter}
                         onCreated={() => { setOpen(false); setToast("Question added to the bank"); load(); }} />
      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast("")} message={toast}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />
    </>
  );
}
