"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const start = (stored as "light" | "dark" | null) ?? (systemDark ? "dark" : "light");
    apply(start);
  }, []);

  const apply = (m: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(m);
    (root as HTMLElement).style.colorScheme = m;
    localStorage.setItem("theme", m);
    setMode(m);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={() => apply(mode === "dark" ? "light" : "dark")}
      className="btn btn-secondary h-10 w-10 p-0"
      aria-label={mode === "dark" ? "Светлая тема" : "Тёмная тема"}
    >
      {mode === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" className="fill-fg">
          <path d="M21.64 13a1 1 0 0 0-1.05-.14 8 8 0 0 1-10.45-10.45 1 1 0 0 0-1.19-1.32A10 10 0 1 0 22 14.24a1 1 0 0 0-.36-1.24z"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" className="fill-fg">
          <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.48 14.32l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM12 5a1 1 0 0 0 1-1V1h-2v3a1 1 0 0 0 1 1zm0 14a1 1 0 0 0-1 1v3h2v-3a1 1 0 0 0-1-1zM5 13a1 1 0 0 0-1-1H1v2h3a1 1 0 0 0 1-1zm18-1h-3a1 1 0 0 0 0 2h3v-2zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>
        </svg>
      )}
    </button>
  );
}
