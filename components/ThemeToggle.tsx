"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  setThemeOverride,
  systemTheme,
  type ThemeMode,
} from "@/lib/theme";

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="size-3.5"
    >
      <circle cx="8" cy="8" r="2.75" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M8 1.5v1.75M8 12.75V14.5M1.5 8h1.75M12.75 8H14.5M3.4 3.4l1.25 1.25M11.35 11.35l1.25 1.25M12.6 3.4l-1.25 1.25M4.65 11.35l-1.25 1.25"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="size-3.5"
    >
      <path
        d="M12.6 9.35A5.25 5.25 0 0 1 6.65 3.4 4.5 4.5 0 1 0 12.6 9.35Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const sync = () => setMode(resolveTheme());
    sync();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (readStoredTheme() == null) {
        const next = systemTheme();
        applyTheme(next);
        setMode(next);
      }
    };
    media.addEventListener("change", onSystem);
    return () => media.removeEventListener("change", onSystem);
  }, []);

  const isDark = mode === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
      title={isDark ? "Day" : "Night"}
      className="inline-flex size-8 items-center justify-center rounded-[2px] border border-border text-muted ui-transition hover:border-accent hover:text-accent"
      onClick={() => {
        const next: ThemeMode = isDark ? "light" : "dark";
        setThemeOverride(next);
        setMode(next);
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
