"use client";
// SoP US4 (Subrata): adaptive quiz UI, US8 random-mode toggle, US5 instant per-answer mastery feedback.
// Quiz picker (teacher-published quiz vs. open-subject practice): SoP US2 (Annandita).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Alert, Box, Button, Card, CardActionArea, CardContent, Chip, Grid, LinearProgress, Skeleton, Stack,
  ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { api, errorMessage, getUser, pct, SUBJECT } from "@/lib/api";
import MasteryRing from "@/components/MasteryRing";
import { ErrorAlert, Metric, PageHeader, Panel } from "@/components/ui";
import { MASTERY_THRESHOLD, MONO } from "@/theme";

const LETTERS = ["a", "b", "c", "d"];
const DIFFICULTY_COLOR = { easy: "success", medium: "warning", hard: "error" };

function OptionButton({ letter, text, state, disabled, onClick }) {
  // state: idle | correct | wrong | dim
  const palette = {
    correct: { borderColor: "success.main", bgcolor: "rgba(47,158,91,.07)" },
    wrong: { borderColor: "error.main", bgcolor: "rgba(194,65,79,.07)" },
    dim: { opacity: 0.55 },
    idle: {},
  }[state];
  return (
    <Card sx={{ transition: "border-color .15s, background-color .15s", ...palette,
                ...(state === "idle" && !disabled ? { "&:hover": { borderColor: "primary.main" } } : {}) }}>
      <CardActionArea onClick={onClick} disabled={disabled} sx={{ px: 1.75, py: 1.4 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Box sx={{ width: 28, height: 28, borderRadius: "6px", flexShrink: 0, display: "grid", placeItems: "center",
                     fontFamily: MONO, fontWeight: 500, textTransform: "uppercase", fontSize: 13,
                     bgcolor: state === "correct" ? "success.main" : state === "wrong" ? "error.main" : "action.hover",
                     color: state === "correct" || state === "wrong" ? "#fff" : "text.primary" }}>
            {letter}
          </Box>
          <Typography sx={{ fontWeight: 500, flexGrow: 1 }}>{text}</Typography>
          {state === "correct" && <CheckCircleRoundedIcon color="success" />}
          {state === "wrong" && <CancelRoundedIcon color="error" />}
        </Stack>
      </CardActionArea>
    </Card>
  );
}

export default function QuizPage() {
  const [user] = useState(getUser);
  const [concepts, setConcepts] = useState([]);
  const [quizzes, setQuizzes] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState("practice");
  const [mode, setMode] = useState("adaptive");
  const [phase, setPhase] = useState("setup"); // setup | question | complete
  const [question, setQuestion] = useState(null);
  const [conceptId, setConceptId] = useState(null);
  const [pick, setPick] = useState(null); // { p_mastery, target_difficulty } from the selector
  const [asked, setAsked] = useState([]);
  const [picked, setPicked] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [ringValue, setRingValue] = useState(0);
  const [results, setResults] = useState([]);
  const [mastery, setMastery] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const feedbackRef = useRef(null);

  useEffect(() => {
    if (feedback && window.innerWidth < 1200) {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [feedback]);

  useEffect(() => {
    api.get("/concepts/", { params: { subject: SUBJECT } }).then((r) => setConcepts(r.data)).catch(() => {});
    api.get(`/quiz/mastery-map/${user.id}`)
      .then((r) => setMastery(Object.fromEntries(r.data.map((m) => [m.concept_id, m.p_mastery])))).catch(() => {});
    api.get("/quizzes/active", { params: { subject: SUBJECT } })
      .then((r) => {
        setQuizzes(r.data);
        if (r.data.length) setSelectedQuizId(r.data[0].id);
      })
      .catch(() => setQuizzes([]));
  }, [user.id]);

  const conceptName = useMemo(() => Object.fromEntries(concepts.map((c) => [c.id, c.name])), [concepts]);
  const selectedQuiz = quizzes?.find((q) => q.id === selectedQuizId) || null;
  const totalConcepts = selectedQuiz ? selectedQuiz.concept_ids.length : concepts.length;
  const currentP = mastery[conceptId] ?? null;

  const loadNext = async (excluded) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get(`/quiz/next-question/${user.id}`, {
        params: { subject: SUBJECT, mode, exclude_concept_ids: excluded.join(","),
                  quiz_id: selectedQuiz ? selectedQuiz.id : undefined },
      });
      if (res.data.complete || !res.data.question) {
        setPhase("complete");
      } else {
        setQuestion(res.data.question);
        setConceptId(res.data.concept_id);
        setPick({ p: res.data.p_mastery, target: res.data.target_difficulty });
        setPicked(null);
        setFeedback(null);
        setPhase("question");
      }
    } catch (err) {
      setError(errorMessage(err, "Failed to load the next question."));
    } finally {
      setLoading(false);
    }
  };

  const start = () => {
    setAsked([]);
    setResults([]);
    loadNext([]);
  };

  const answer = async (option) => {
    setPicked(option);
    setError("");
    try {
      const res = await api.post("/quiz/submit-answer", {
        student_id: user.id, question_id: question.id, selected_option: option, mode,
        quiz_id: selectedQuiz ? selectedQuiz.id : null,
      });
      setFeedback(res.data);
      setRingValue(res.data.p_mastery_before);
      setTimeout(() => setRingValue(res.data.p_mastery_after), 350);
      setResults((r) => [...r, { conceptId, ...res.data }]);
      setMastery((m) => ({ ...m, [conceptId]: res.data.p_mastery_after }));
    } catch (err) {
      setPicked(null);
      setError(errorMessage(err, "Failed to submit your answer."));
    }
  };

  const next = () => {
    const updated = [...asked, conceptId];
    setAsked(updated);
    loadNext(updated);
  };

  const optionState = (letter) => {
    if (!feedback) return "idle";
    if (letter === feedback.correct_option) return "correct";
    if (letter === picked) return "wrong";
    return "dim";
  };

  // ---------- Setup ----------
  if (phase === "setup") {
    const options = [
      ...(quizzes || []).map((q) => ({ id: q.id, title: q.title, sub: `${q.concept_ids.length} concepts · published by your teacher` })),
      { id: "practice", title: "Open practice", sub: `Every concept in ${SUBJECT}` },
    ];
    return (
      <>
        <PageHeader eyebrow={SUBJECT} title="Start a quiz"
                    subtitle="Choose a quiz and a selection mode. Your mastery estimate for each concept updates after every answer." />
        <ErrorAlert error={error} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Panel title="Quiz">
              {quizzes === null ? <Skeleton variant="rounded" height={120} /> : (
                <Stack spacing={1}>
                  {options.map((o) => {
                    const active = selectedQuizId === o.id;
                    return (
                      <Card key={o.id} sx={{ borderColor: active ? "primary.main" : undefined, bgcolor: active ? "primary.light" : undefined }}>
                        <CardActionArea onClick={() => setSelectedQuizId(o.id)} sx={{ px: 1.75, py: 1.4 }} aria-pressed={active}>
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                            {active ? <CheckCircleRoundedIcon color="primary" fontSize="small" />
                                    : <RadioButtonUncheckedRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />}
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.title}</Typography>
                              <Typography variant="caption" color="text.secondary">{o.sub}</Typography>
                            </Box>
                          </Stack>
                        </CardActionArea>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Panel>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Panel title="Selection mode">
              <ToggleButtonGroup exclusive fullWidth size="small" value={mode} onChange={(_, v) => v && setMode(v)} color="primary">
                <ToggleButton value="adaptive">Adaptive</ToggleButton>
                <ToggleButton value="random">Random</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, minHeight: 62 }}>
                {mode === "adaptive"
                  ? "Picks the concept you have practised least, and among those the one you know least. No concept repeats within a session."
                  : "Research baseline: concepts are drawn at random. Mastery still updates after every answer."}
              </Typography>
              <Button fullWidth variant="contained" size="large" sx={{ mt: 1 }} onClick={start} disabled={loading || quizzes === null}>
                Start quiz
              </Button>
            </Panel>
          </Grid>
        </Grid>
      </>
    );
  }

  // ---------- Complete ----------
  if (phase === "complete") {
    const correct = results.filter((r) => r.correct).length;
    const gained = results.reduce((t, r) => t + (r.p_mastery_after - r.p_mastery_before), 0) / Math.max(results.length, 1);
    return (
      <>
        <PageHeader eyebrow="Session complete" title={selectedQuiz ? selectedQuiz.title : "Open practice"}
                    subtitle={`You answered one question on each of the ${results.length} concepts.`}
                    action={
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={() => setPhase("setup")}>New quiz</Button>
                        <Button component={Link} href="/mastery" variant="contained">View mastery</Button>
                      </Stack>
                    } />
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 4 }}><Metric label="Score" value={`${correct}/${results.length}`} hint={`${pct(correct / Math.max(results.length, 1))} correct`} /></Grid>
          <Grid size={{ xs: 6, md: 4 }}><Metric label="Avg. change per concept" value={`${gained >= 0 ? "+" : ""}${Math.round(gained * 100)} pts`}
                                                 tone={gained >= 0 ? "success" : "error"} hint="mastery estimate" /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Metric label="Mode" value={mode === "adaptive" ? "Adaptive" : "Random"} hint="question selection" /></Grid>
          <Grid size={12}>
            <Panel title="Mastery change by concept">
              <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />}>
                {results.map((r, i) => {
                  const delta = Math.round((r.p_mastery_after - r.p_mastery_before) * 100);
                  return (
                    <Box key={i} sx={{ display: "grid", gap: { xs: 0.75, sm: 2 }, py: 1.25, alignItems: "center",
                                       gridTemplateColumns: { xs: "1fr auto", sm: "minmax(140px, 1fr) 2fr auto" } }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                        {r.correct ? <CheckCircleRoundedIcon color="success" fontSize="small" /> : <CancelRoundedIcon color="error" fontSize="small" />}
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{conceptName[r.conceptId]}</Typography>
                      </Stack>
                      <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto" }, gridRow: { xs: 2, sm: "auto" }, position: "relative" }}>
                        <LinearProgress variant="determinate" value={r.p_mastery_after * 100}
                                        color={r.p_mastery_after >= MASTERY_THRESHOLD ? "success" : "error"} />
                        <Box sx={{ position: "absolute", top: -3, bottom: -3, width: 2, bgcolor: "text.primary", opacity: 0.5,
                                   left: `${r.p_mastery_before * 100}%` }} title="before this answer" />
                      </Box>
                      <Typography variant="body2" sx={{ fontFamily: MONO, whiteSpace: "nowrap", textAlign: "right" }}>
                        {Math.round(r.p_mastery_before * 100)} → {Math.round(r.p_mastery_after * 100)}{" "}
                        <Box component="span" sx={{ color: delta >= 0 ? "success.main" : "error.main" }}>({delta >= 0 ? "+" : ""}{delta})</Box>
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
              <Typography variant="caption" color="text.secondary">Bar = mastery after the answer; the dark tick marks where it was before.</Typography>
            </Panel>
          </Grid>
        </Grid>
      </>
    );
  }

  // ---------- Question ----------
  const answeredCount = asked.length + (feedback ? 1 : 0);
  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5, gap: 2, flexWrap: "wrap" }}>
        <Typography variant="overline" color="text.secondary">
          {selectedQuiz ? selectedQuiz.title : "Open practice"} · {mode}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Question {asked.length + 1} of {totalConcepts}
        </Typography>
      </Stack>
      <LinearProgress variant="determinate" value={(answeredCount / Math.max(totalConcepts, 1)) * 100} sx={{ mb: 3 }} />
      <ErrorAlert error={error} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
                <Chip label={conceptName[conceptId] || "Concept"} color="primary" size="small" />
                {question?.difficulty && <Chip label={question.difficulty} variant="outlined" size="small"
                                               color={DIFFICULTY_COLOR[question.difficulty] || "default"} sx={{ textTransform: "capitalize" }} />}
              </Stack>
              <Typography variant="h5" component="h2" sx={{ mb: 3, lineHeight: 1.4, fontSize: { xs: "1.15rem", sm: "1.35rem" } }}>{question?.text}</Typography>
              <Stack spacing={1}>
                {LETTERS.map((l) => (
                  <OptionButton key={l} letter={l} text={question?.[`option_${l}`]} state={optionState(l)}
                                disabled={!!picked || loading} onClick={() => answer(l)} />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }} ref={feedbackRef}>
            <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
              {!feedback ? (
                <>
                  <Typography variant="h6">Why this concept</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {mode === "adaptive"
                      ? `${conceptName[conceptId] || "This concept"} is the one you've practised least so far, and among those your mastery is lowest — so this answer tells AdaptIQ the most.`
                      : "Random mode: this concept was drawn at random, as the baseline for the adaptive-vs-random study."}
                  </Typography>
                  {mode === "adaptive" && pick?.target && (
                    <>
                      <Typography variant="h6" sx={{ mt: 2.5 }}>Why this difficulty</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} className="difficulty-reason">
                        {`Your estimate here is ${pct(pick.p)}, so AdaptIQ chose ${pick.target === "easy" ? "an easy" : pick.target === "medium" ? "a medium" : "a hard"} question. `}
                        Below 40% you get easy questions, 40–70% medium, and 70% or more hard.
                      </Typography>
                    </>
                  )}
                  <Stack direction="row" sx={{ mt: { xs: 2, lg: "auto" }, pt: 2, borderTop: 1, borderColor: "divider", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Current estimate</Typography>
                    <Typography variant="body2" sx={{ fontFamily: MONO }}>{currentP == null ? "—" : pct(currentP)}</Typography>
                  </Stack>
                </>
              ) : (
                <>
                  <Alert severity={feedback.correct ? "success" : "error"} sx={{ mb: 2.5 }}>
                    {feedback.correct ? "Correct." : `Incorrect — the answer is ${feedback.correct_option.toUpperCase()}.`}
                  </Alert>
                  <Stack direction={{ xs: "row", lg: "column" }} spacing={2.5} sx={{ alignItems: "center" }}>
                    <Box sx={{ flexShrink: 0 }}><MasteryRing value={ringValue} size={112} /></Box>
                    <Box sx={{ textAlign: { xs: "left", lg: "center" }, minWidth: 0 }}>
                      <Typography variant="body2" color="text.secondary">{conceptName[conceptId]} · mastery estimate</Typography>
                      <Typography sx={{ fontFamily: MONO, fontSize: 20, mt: 0.5 }} className="mastery-shift">
                        {Math.round(feedback.p_mastery_before * 100)}% → {Math.round(feedback.p_mastery_after * 100)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {feedback.correct
                          ? "A right answer is evidence you know it, allowing for a lucky guess."
                          : "A wrong answer lowers it, allowing for a slip; the learning step then adds a little back."}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />} onClick={next}
                          disabled={loading} sx={{ mt: { xs: 3, lg: "auto" } }} fullWidth>
                    {asked.length + 1 >= totalConcepts ? "Finish" : "Next question"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
