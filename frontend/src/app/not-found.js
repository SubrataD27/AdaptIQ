"use client";
import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", p: 3 }}>
      <Box>
        <Typography variant="h3">Page not found</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>That page doesn&apos;t exist in AdaptIQ.</Typography>
        <Button component={Link} href="/" variant="contained">Back to sign in</Button>
      </Box>
    </Box>
  );
}
