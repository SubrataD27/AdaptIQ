"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar, Avatar, Box, CircularProgress, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Stack, Toolbar, Tooltip, Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { clearSession, getUser, homeFor, SUBJECT } from "@/lib/api";

const DRAWER_WIDTH = 240;

const NAV = {
  student: [
    { href: "/quiz", label: "Quiz", icon: <QuizOutlinedIcon fontSize="small" /> },
    { href: "/mastery", label: "Mastery", icon: <InsightsOutlinedIcon fontSize="small" /> },
    { href: "/history", label: "History", icon: <HistoryOutlinedIcon fontSize="small" /> },
  ],
  teacher: [
    { href: "/teacher", label: "Class overview", icon: <SpaceDashboardOutlinedIcon fontSize="small" /> },
    { href: "/questions", label: "Question bank", icon: <LibraryBooksOutlinedIcon fontSize="small" /> },
    { href: "/research", label: "Research", icon: <ScienceOutlinedIcon fontSize="small" /> },
  ],
};

export function Logo({ inverted = false, size = 28 }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Box component="svg" viewBox="0 0 32 32" sx={{ width: size, height: size, flexShrink: 0 }} aria-hidden>
        <rect width="32" height="32" rx="7" fill={inverted ? "#ffffff" : "#2f5bd3"} />
        <path d="M7 23 L13 16 L18 19 L25 9" fill="none" stroke={inverted ? "#0f172a" : "#ffffff"}
              strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="25" cy="9" r="2.4" fill={inverted ? "#0f172a" : "#ffffff"} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: size * 0.68, letterSpacing: "-0.02em", color: inverted ? "#fff" : "text.primary" }}>
        AdaptIQ
      </Typography>
    </Stack>
  );
}

function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const current = mode === "system" ? systemMode : mode;
  if (!current) return null;
  return (
    <Tooltip title={current === "dark" ? "Light mode" : "Dark mode"}>
      <IconButton size="small" onClick={() => setMode(current === "dark" ? "light" : "dark")} aria-label="Toggle dark mode">
        {current === "dark" ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const u = getUser();
    const allowed = u && NAV[u.role]?.some((n) => pathname.startsWith(n.href));
    if (!u) router.replace("/");
    else if (!allowed) router.replace(homeFor(u));
    else setUser(u);
  }, [pathname, router]);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (!user) {
    return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><CircularProgress size={28} /></Box>;
  }

  const logout = () => {
    clearSession();
    router.replace("/");
  };

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", px: 1.5, py: 2 }}>
      <Box sx={{ px: 1, pb: 2 }}><Logo /></Box>
      <Typography variant="overline" color="text.secondary" sx={{ px: 1.25 }}>{SUBJECT}</Typography>
      <List dense sx={{ mt: 0.5 }}>
        {NAV[user.role].map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <ListItemButton key={item.href} component={Link} href={item.href} selected={active}
                            sx={{ borderRadius: "6px", mb: 0.25, py: 0.9,
                                  "&.Mui-selected": { bgcolor: "primary.light", color: "primary.main",
                                    "& .MuiListItemIcon-root": { color: "primary.main" },
                                    "&:hover": { bgcolor: "primary.light" } } }}>
              <ListItemIcon sx={{ minWidth: 34 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: active ? 600 : 500, fontSize: "0.92rem" } } }} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ mb: 1.5 }} />
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", px: 0.5 }}>
        <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "secondary.main", color: "background.paper" }}>
          {user.name?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{user.name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>{user.role}</Typography>
        </Box>
        <ThemeToggle />
        <Tooltip title="Log out">
          <IconButton size="small" onClick={logout} aria-label="Log out"><LogoutRoundedIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="fixed" color="inherit" elevation={0}
              sx={{ display: { md: "none" }, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        <Toolbar variant="dense" sx={{ minHeight: 56 }}>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open menu" sx={{ mr: 1 }}>
            <MenuRoundedIcon />
          </IconButton>
          <Logo size={26} />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
                sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" open
                sx={{ display: { xs: "none", md: "block" },
                      "& .MuiDrawer-paper": { width: DRAWER_WIDTH, borderRight: 1, borderColor: "divider" } }}>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ px: { xs: 2, sm: 3, lg: 5 }, pt: { xs: 10, md: 5 }, pb: 8, maxWidth: 1320, mx: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
