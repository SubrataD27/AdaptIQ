"use client";
import { createTheme } from "@mui/material/styles";

export const MASTERY_THRESHOLD = 0.6; // same as the backend's needs_revision flag

// Chart colours, shared so every chart reads the same way.
export const CHART = {
  primary: "#2f5bd3",
  neutral: "#94a3b8",
  good: "#2f9e5b",
  weak: "#d1495b",
  grid: "rgba(100, 116, 139, 0.18)",
};

// Mastery bins for heatmaps and legends (muted, colour-blind-safe ordering by lightness).
export const MASTERY_BINS = [
  { max: 0.4, label: "< 40%", bg: "#f4c7cc", fg: "#7f1d2d" },
  { max: 0.6, label: "40–59%", bg: "#f8e2b8", fg: "#7a4a06" },
  { max: 0.8, label: "60–79%", bg: "#c9e8d2", fg: "#14532d" },
  { max: 1.01, label: "80%+", bg: "#7fc79a", fg: "#0b3d20" },
];
export const masteryBin = (v) => MASTERY_BINS.find((b) => v < b.max) || MASTERY_BINS[MASTERY_BINS.length - 1];

const FONT = '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const MONO = '"IBM Plex Mono", ui-monospace, "Cascadia Mono", Consolas, monospace';

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#2f5bd3", dark: "#2448ad", light: "#e8eefc", contrastText: "#fff" },
        secondary: { main: "#0f172a" },
        success: { main: "#2f9e5b" },
        error: { main: "#c2414f" },
        warning: { main: "#b7791f" },
        background: { default: "#f7f7f5", paper: "#ffffff" },
        text: { primary: "#111827", secondary: "#5b6474" },
        divider: "#e6e6e1",
      },
    },
    dark: {
      palette: {
        primary: { main: "#7c9cf0", dark: "#5f82e6", light: "rgba(124,156,240,.14)", contrastText: "#0b1020" },
        secondary: { main: "#e5e7eb" },
        success: { main: "#5cc489" },
        error: { main: "#ef7d89" },
        warning: { main: "#e3b04b" },
        background: { default: "#0e1116", paper: "#151a21" },
        text: { primary: "#e7e9ee", secondary: "#9aa3b2" },
        divider: "#262c36",
      },
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: FONT,
    h3: { fontWeight: 600, letterSpacing: "-0.02em" },
    h4: { fontWeight: 600, letterSpacing: "-0.015em", fontSize: "1.85rem" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, fontSize: "1.05rem" },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
    overline: { fontWeight: 600, letterSpacing: "0.08em", fontSize: "0.7rem" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 6 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0, variant: "outlined" },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500, borderRadius: 6 } } },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
        head: ({ theme }) => ({ fontWeight: 600, color: theme.vars.palette.text.secondary, fontSize: "0.78rem" }),
      },
    },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 2, height: 6 }, bar: { borderRadius: 2 } } },
    MuiTextField: { defaultProps: { fullWidth: true, size: "small" } },
    MuiToggleButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
  },
});

export default theme;
