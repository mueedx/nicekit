export const THEME_STORAGE_KEY = "theme";

export type ThemeMode = "light" | "dark";

export function systemTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function readStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function resolveTheme(): ThemeMode {
  return readStoredTheme() ?? systemTheme();
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(mode);
}

export function setThemeOverride(mode: ThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyTheme(mode);
}
