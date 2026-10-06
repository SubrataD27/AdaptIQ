"use client";
import { Box, CircularProgress, Typography } from "@mui/material";
import { MASTERY_THRESHOLD, MONO } from "@/theme";

// Circular mastery gauge used for the live per-answer update in the quiz.
export default function MasteryRing({ value, size = 120, thickness = 3.4 }) {
  const v = Math.min(Math.max(value ?? 0, 0), 1);
  const color = v >= MASTERY_THRESHOLD ? "success" : "error";
  return (
    <Box sx={{ position: "relative", width: size, height: size }} role="img" aria-label={`${Math.round(v * 100)}% mastery`}>
      <CircularProgress variant="determinate" value={100} size={size} thickness={thickness}
                        sx={{ color: "divider", position: "absolute", inset: 0 }} />
      <CircularProgress variant="determinate" value={v * 100} size={size} thickness={thickness} color={color}
                        sx={{ position: "absolute", inset: 0,
                              "& circle": { transition: "stroke-dashoffset 800ms cubic-bezier(.2,.8,.2,1)" } }} />
      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <Typography sx={{ fontFamily: MONO, fontWeight: 500, fontSize: size * 0.2 }}>{Math.round(v * 100)}%</Typography>
      </Box>
    </Box>
  );
}
