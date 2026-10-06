"use client";
import { Alert, Box, Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";
import { MASTERY_BINS, MONO } from "@/theme";

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
           sx={{ mb: { xs: 3, md: 4 }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "flex-end" } }}>
      <Box sx={{ minWidth: 0 }}>
        {eyebrow && <Typography variant="overline" color="text.secondary">{eyebrow}</Typography>}
        <Typography variant="h4" component="h1">{title}</Typography>
        {subtitle && <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 680 }}>{subtitle}</Typography>}
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Stack>
  );
}

// Plain metric: label, big number, context line. Optional `aside` (e.g. a sparkline).
export function Metric({ label, value, hint, tone, aside }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 }, display: "flex", gap: 2, alignItems: "flex-end" }}>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: { xs: "1.6rem", md: "1.85rem" }, fontWeight: 500, lineHeight: 1.25, mt: 0.5,
                            color: tone ? `${tone}.main` : "text.primary" }}>
            {value ?? <Skeleton width={70} />}
          </Typography>
          {hint && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>{hint}</Typography>}
        </Box>
        {aside && <Box sx={{ width: 96, flexShrink: 0, display: { xs: "none", sm: "block" } }}>{aside}</Box>}
      </CardContent>
    </Card>
  );
}

export function Panel({ title, subtitle, action, children, sx, contentSx }) {
  return (
    <Card sx={{ height: "100%", ...sx }}>
      {(title || action) && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}
               sx={{ px: { xs: 2, sm: 2.5 }, pt: 2.25, pb: 1.5, justifyContent: "space-between", alignItems: { sm: "flex-start" } }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h2">{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography>}
          </Box>
          {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Stack>
      )}
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: 2.5, pt: title ? 0.5 : 2.5, ...contentSx }}>{children}</Box>
    </Card>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {text && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{text}</Typography>}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}

export function ErrorAlert({ error }) {
  return error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null;
}

export function MasteryLegend() {
  return (
    <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 0.75, alignItems: "center" }}>
      {MASTERY_BINS.map((b) => (
        <Stack key={b.label} direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Box sx={{ width: 12, height: 12, borderRadius: "2px", bgcolor: b.bg, border: "1px solid rgba(0,0,0,.06)" }} />
          <Typography variant="caption" color="text.secondary">{b.label}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export const LoadingBlock = ({ height = 240 }) => <Skeleton variant="rounded" height={height} />;
