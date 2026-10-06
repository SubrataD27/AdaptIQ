"use client";
import axios from "axios";
import { useEffect, useState } from "react";

export const SUBJECT = "Data Structures";
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (!err?.response) return "Can't reach the AdaptIQ server. Is the backend running on port 8000?";
  const detail = err.response.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

export function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export const homeFor = (user) => (user?.role === "teacher" ? "/teacher" : "/quiz");

// Reads the session after mount (localStorage isn't available during SSR).
export function useSession() {
  const [state, setState] = useState({ user: null, ready: false });
  useEffect(() => setState({ user: getUser(), ready: true }), []);
  return state;
}

export const pct = (v, digits = 0) => (v == null ? "—" : `${(v * 100).toFixed(digits)}%`);
