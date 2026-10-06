"use client";
// SoP US6 (Annandita): concept-wise mastery map, learning curves and revision suggestions.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Button, Card, Chip, Grid, Stack, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { api, errorMessage, getUser, pct, SUBJECT } from "@/lib/api";
import { EmptyState, ErrorAlert, LoadingBlock, Metric, PageHeader, Panel } from "@/components/ui";
import { CHART, MASTERY_THRESHOLD, MONO } from "@/theme";

export default function MasteryPage() {
  const [user] = useState(getUser);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/quiz/mastery-map/${user.id}`), api.get("/concepts/", { params: { subject: SUBJECT } }),
      api.get(`/quiz/progress/${user.id}`),
    ]).then(([m, c, p]) => {
      const byId = Object.fromEntries(m.data.map((d) => [d.concept_id, d]));
      setData({
        answers: p.data.length,
        correct: p.data.filter((a) => a.is_correct).length,
        concepts: c.data.map((concept) => {
          const steps = p.data.filter((a) => a.concept_id === concept.id);
          return {
            id: concept.id, name: concept.name,
            p: byId[concept.id]?.p_mastery ?? null,
            curve: steps.length ? [steps[0].p_mastery_before, ...steps.map((a) => a.p_mastery_after)] : [],
            attempts: steps.length,
            correct: steps.filter((a) => a.is_correct).length,
          };
        }),
      });
    }).catch((err) => { setError(errorMessage(err, "Failed to load your mastery map.")); setData({ concepts: [], answers: 0 }); });
  }, [user.id]);

  const tried = (data?.concepts || []).filter((c) => c.p != null);
  const overall = tried.length ? tried.reduce((s, c) => s + c.p, 0) / tried.length : null;
  const mastered = tried.filter((c) => c.p >= MASTERY_THRESHOLD).length;
  const revision = tried.filter((c) => c.p < MASTERY_THRESHOLD).sort((a, b) => a.p - b.p);

  return (
    <>
      <PageHeader eyebrow="Mastery" title={`${user?.name ?? ""}`}
                  subtitle="AdaptIQ's current estimate of how well you know each concept, and how it has changed with every answer."
                  action={<Button component={Link} href="/quiz" variant="contained">Practise now</Button>} />
      <ErrorAlert error={error} />

      {!data ? <LoadingBlock height={360} /> : tried.length === 0 ? (
        <Card><EmptyState title="No mastery data yet" text="Take your first quiz and your mastery map will appear here."
                          action={<Button component={Link} href="/quiz" variant="contained">Start a quiz</Button>} /></Card>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}><Metric label="Overall mastery" value={pct(overall)} hint="average across concepts" /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Metric label="Mastered" value={`${mastered}/${data.concepts.length}`} hint="concepts at 60% or above" /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Metric label="To revise" value={revision.length} tone={revision.length ? "error" : undefined} hint="concepts below 60%" /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Metric label="Answers" value={data.answers} hint={`${data.correct} correct`} /></Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Panel title="Mastery profile" subtitle="Current estimate per concept. The dashed line is the 60% mastery target.">
              <BarChart height={Math.max(240, data.concepts.length * 42 + 50)} layout="horizontal" margin={{ left: 0, right: 28, top: 8 }}
                        dataset={data.concepts.map((c) => ({ concept: c.name, mastery: c.p == null ? 0 : Math.round(c.p * 100) }))}
                        yAxis={[{ scaleType: "band", dataKey: "concept", width: 92, categoryGapRatio: 0.35 }]}
                        xAxis={[{ min: 0, max: 100, valueFormatter: (v) => `${v}%`,
                                  colorMap: { type: "piecewise", thresholds: [60], colors: [CHART.weak, CHART.good] } }]}
                        series={[{ dataKey: "mastery", label: "Mastery", valueFormatter: (v) => `${v}%` }]}
                        hideLegend grid={{ vertical: true }}>
                <ChartsReferenceLine x={60} lineStyle={{ stroke: "#64748b", strokeDasharray: "4 4" }} />
              </BarChart>
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Panel title="Learning curves" subtitle="Your estimate after each answer on that concept, oldest to newest">
              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                {data.concepts.map((c) => (
                  <Box key={c.id} sx={{ border: 1, borderColor: "divider", borderRadius: "6px", p: 1.5 }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{c.name}</Typography>
                      <Typography sx={{ fontFamily: MONO, fontSize: 15, fontWeight: 500,
                                        color: c.p == null ? "text.secondary" : c.p >= MASTERY_THRESHOLD ? "success.main" : "error.main" }}>
                        {c.p == null ? "—" : pct(c.p)}
                      </Typography>
                    </Stack>
                    {c.curve.length > 1 ? (
                      <SparkLineChart data={c.curve.map((v) => Math.round(v * 100))} height={48} curve="linear" showHighlight showTooltip
                                      yAxis={{ min: 0, max: 100 }} margin={{ top: 4, bottom: 4, left: 2, right: 2 }}
                                      color={c.p >= MASTERY_THRESHOLD ? CHART.good : CHART.weak}
                                      valueFormatter={(v) => `${v}%`} />
                    ) : <Box sx={{ height: 44, display: "grid", alignItems: "center" }}><Typography variant="caption" color="text.secondary">Not practised yet</Typography></Box>}
                    <Typography variant="caption" color="text.secondary">{c.attempts} answer{c.attempts === 1 ? "" : "s"} · {c.correct} correct</Typography>
                  </Box>
                ))}
              </Box>
            </Panel>
          </Grid>

          <Grid size={12}>
            <Panel title="Suggested revision" subtitle="Concepts below 60%, weakest first">
              {revision.length === 0 ? (
                <Typography color="text.secondary">Everything you have practised is at 60% or above.</Typography>
              ) : (
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" } }}>
                  {revision.map((c) => (
                    <Stack key={c.id} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1,
                                                            p: 1.5, border: 1, borderColor: "divider", borderRadius: "6px" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{c.name}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: MONO, color: "error.main" }}>{pct(c.p)} mastery</Typography>
                      </Box>
                      <Chip size="small" label="Revise" color="error" variant="outlined" />
                    </Stack>
                  ))}
                </Box>
              )}
            </Panel>
          </Grid>
        </Grid>
      )}
    </>
  );
}
