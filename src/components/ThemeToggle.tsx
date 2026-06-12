"use client";

import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    } else if (saved === "light") {
      setDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      // Respect system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        aria-label="Toggle dark mode"
        className="relative w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-sm"
      >
        <span className="text-lg">🌙</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={dark ? "Chế độ sáng ☀️" : "Chế độ tối 🌙"}
      className="relative w-11 h-11 rounded-full border-2 flex items-center justify-center shadow-sm cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden group bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
    >
      {/* Sun icon */}
      <span
        className={`absolute text-xl transition-all duration-500 ${
          dark
            ? "translate-y-10 opacity-0 rotate-180"
            : "translate-y-0 opacity-100 rotate-0"
        }`}
      >
        ☀️
      </span>

      {/* Moon icon */}
      <span
        className={`absolute text-xl transition-all duration-500 ${
          dark
            ? "translate-y-0 opacity-100 rotate-0"
            : "-translate-y-10 opacity-0 -rotate-180"
        }`}
      >
        🌙
      </span>

      {/* Glow ring effect on hover */}
      <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-4 ring-amber-300/30 dark:ring-indigo-400/30" />
    </button>
  );
}
