"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    function sync() {
      let saved: string | null = null;
      try { saved = localStorage.getItem("adam-theme"); } catch { /* Default to light. */ }
      const next = saved === "dark" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.classList.toggle("light", next === "light");
      setTheme(next);
    }
    sync();
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("storage", sync); };
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
    try { localStorage.setItem("adam-theme", next); } catch { /* The theme still works without storage. */ }
    setTheme(next);
  }

  return (
    <button type="button" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} className="theme-toggle glass-control focus-ring">
      {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      <span>Switch to {theme === "dark" ? "light" : "dark"}</span>
    </button>
  );
}
