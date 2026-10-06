"use client";
// Quiz history for students, grouped by quiz session. Supplementary — not one of the SoP's 8 core stories.
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, Chip, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { api, errorMessage, getUser, pct } from "@/lib/api";
import { EmptyState, ErrorAlert, LoadingBlock, PageHeader, Panel } from "@/components/ui";
import { CHART, MONO } from "@/theme";

const formatDay = (day) => new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const shortDay = (day) => new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export default function HistoryPage() {
  const [user] = useState(getUser);
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/quiz/history/${user.id}`)
      .then((r) => setSessions(r.data))
      .catch((err) => { setError(errorMessage(err, "Failed to load quiz history.")); setSessions([]); });
  }, [user.id]);

  const total = (sessions || []).reduce((s, x) => s + x.total, 0);
  const correct = (sessions || []).reduce((s, x) => s + x.correct, 0);
  const chrono = [...(sessions || [])].reverse();

  return (
    <>
      <PageHeader eyebrow="History" title="Quiz sessions"
                  subtitle={sessions?.length ? `${sessions.length} sessions · ${correct} of ${total} answers correct (${pct(correct / Math.max(total, 1))})` : "Every quiz session you have taken."} />
      <ErrorAlert error={error} />
      {sessions === null ? <LoadingBlock height={240} /> : sessions.length === 0 ? (
        <Card><EmptyState title="No sessions yet" text="Your quiz sessions will show up here."
                          action={<Button component={Link} href="/quiz" variant="contained">Take a quiz</Button>} /></Card>
      ) : (
        <Stack spacing={2}>
          <Panel title="Score per session" subtitle="Share of answers correct, oldest to newest">
            <BarChart height={220} margin={{ left: 0, right: 8, top: 8 }}
                      xAxis={[{ scaleType: "band", data: chrono.map((s, i) => `${i + 1}`), label: "Session" }]}
                      yAxis={[{ min: 0, max: 100, width: 40, valueFormatter: (v) => `${v}%` }]}
                      series={[{ data: chrono.map((s) => Math.round((s.correct / s.total) * 100)), color: CHART.primary,
                                 valueFormatter: (v, { dataIndex }) => {
                                   const s = chrono[dataIndex];
                                   return `${s.correct}/${s.total} correct · ${s.quiz_title || "Open practice"} · ${s.day ? shortDay(s.day) : ""}`;
                                 } }]}
                      hideLegend grid={{ horizontal: true }} />
          </Panel>

          <Box>
            {sessions.map((s, i) => (
              <Accordion key={s.key || s.date} defaultExpanded={i === 0} disableGutters elevation={0}
                         sx={{ border: 1, borderColor: "divider", "&:not(:last-of-type)": { borderBottom: 0 }, "&:before": { display: "none" },
                               "&:first-of-type": { borderTopLeftRadius: 8, borderTopRightRadius: 8 },
                               "&:last-of-type": { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 } }}>
                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: { xs: 1.5, sm: 2.5 } }}>
                  <Box sx={{ display: "grid", width: "100%", pr: 1, alignItems: "center", columnGap: 2, rowGap: 0.5,
                             gridTemplateColumns: { xs: "1fr auto", sm: "minmax(0, 2fr) 1fr auto" } }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{s.quiz_title || "Open practice"}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.day ? formatDay(s.day) : s.date}</Typography>
                    </Box>
                    <Box sx={{ display: { xs: "none", sm: "block" } }}>
                      {s.mode && <Chip size="small" label={s.mode} variant="outlined" sx={{ textTransform: "capitalize" }} />}
                    </Box>
                    <Typography sx={{ fontFamily: MONO, fontSize: 14 }}>{s.correct}/{s.total}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 1, sm: 2.5 }, pt: 0 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Concept</TableCell><TableCell>Mode</TableCell><TableCell align="right">Result</TableCell></TableRow></TableHead>
                      <TableBody>
                        {s.attempts.map((a, j) => (
                          <TableRow key={j}>
                            <TableCell>{a.concept}</TableCell>
                            <TableCell sx={{ textTransform: "capitalize", color: "text.secondary" }}>{a.mode}</TableCell>
                            <TableCell align="right" sx={{ color: a.is_correct ? "success.main" : "error.main", fontWeight: 500 }}>
                              {a.is_correct ? "Correct" : "Incorrect"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Stack>
      )}
    </>
  );
}
