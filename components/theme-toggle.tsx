"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function sync() {
      let saved: string | null = null;
      try { saved = localStorage.getItem("adam-theme"); } catch { /* Use system preference. */ }
      const next = saved === "light" || saved === "dark" ? saved : media.matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.classList.toggle("light", next === "light");
      setTheme(next);
    }
    sync();
    window.addEventListener("storage", sync);
    media.addEventListener("change", sync);
    return () => { window.removeEventListener("storage", sync); media.removeEventListener("change", sync); };
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
    try { localStorage.setItem("adam-theme", next); } catch { /* The theme still works without storage. */ }
    setTheme(next);
  }

  return (
    <button type="button" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} className="focus-ring fixed bottom-5 right-5 z-50 flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 py-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-accent">
      {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
