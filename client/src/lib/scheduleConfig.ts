import { useEffect, useState } from "react";

const PERIODS_KEY = "periods_count";
const COLOR_THEME_KEY = "color_theme";
const PERIODS_EVENT = "periods-count-changed";
const COLOR_THEME_EVENT = "color-theme-changed";

export const MIN_PERIODS = 1;
export const MAX_PERIODS = 12;
export const DEFAULT_PERIODS = 7;

export const COLOR_THEMES = [
  { id: "blue", label: "الأزرق (الافتراضي)", color: "#1e40af" },
  { id: "red", label: "الأحمر", color: "#dc2626" },
  { id: "green", label: "الأخضر", color: "#16a34a" },
  { id: "yellow", label: "الأصفر", color: "#ca8a04" },
  { id: "orange", label: "البرتقالي", color: "#ea580c" },
  { id: "purple", label: "البنفسجي", color: "#7c3aed" },
  { id: "pink", label: "الوردي", color: "#db2777" },
  { id: "teal", label: "الفيروزي", color: "#0d9488" },
] as const;

export type ColorThemeId = (typeof COLOR_THEMES)[number]["id"];

export function getPeriodsCount(): number {
  try {
    const raw = localStorage.getItem(PERIODS_KEY);
    if (!raw) return DEFAULT_PERIODS;
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < MIN_PERIODS || n > MAX_PERIODS) return DEFAULT_PERIODS;
    return n;
  } catch {
    return DEFAULT_PERIODS;
  }
}

export function setPeriodsCount(count: number) {
  const clamped = Math.max(MIN_PERIODS, Math.min(MAX_PERIODS, Math.floor(count)));
  localStorage.setItem(PERIODS_KEY, String(clamped));
  window.dispatchEvent(new CustomEvent(PERIODS_EVENT, { detail: clamped }));
}

export function getActivePeriods(): number[] {
  const n = getPeriodsCount();
  return Array.from({ length: n }, (_, i) => i + 1);
}

export function usePeriodsCount(): number {
  const [count, setCount] = useState<number>(() => getPeriodsCount());
  useEffect(() => {
    const handler = () => setCount(getPeriodsCount());
    window.addEventListener(PERIODS_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(PERIODS_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return count;
}

export function useActivePeriods(): number[] {
  const count = usePeriodsCount();
  return Array.from({ length: count }, (_, i) => i + 1);
}

export function getColorTheme(): ColorThemeId {
  try {
    const raw = localStorage.getItem(COLOR_THEME_KEY);
    if (raw && COLOR_THEMES.some((t) => t.id === raw)) {
      return raw as ColorThemeId;
    }
  } catch {}
  return "blue";
}

export function setColorTheme(id: ColorThemeId) {
  localStorage.setItem(COLOR_THEME_KEY, id);
  applyColorTheme(id);
  window.dispatchEvent(new CustomEvent(COLOR_THEME_EVENT, { detail: id }));
}

export function applyColorTheme(id: ColorThemeId) {
  const root = document.documentElement;
  COLOR_THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
  root.classList.add(`theme-${id}`);
}

export function useColorTheme(): [ColorThemeId, (id: ColorThemeId) => void] {
  const [theme, setTheme] = useState<ColorThemeId>(() => getColorTheme());
  useEffect(() => {
    const handler = () => setTheme(getColorTheme());
    window.addEventListener(COLOR_THEME_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(COLOR_THEME_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return [theme, setColorTheme];
}
