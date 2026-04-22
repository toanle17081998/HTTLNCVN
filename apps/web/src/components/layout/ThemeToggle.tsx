"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";

type Theme = "light" | "dark";

const storageKey = "httlncvn.theme";
const listeners = new Set<() => void>();
let clientTheme: Theme | null = null;

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

function getPreferredTheme(): Theme {
  try {
    const savedTheme = window.localStorage.getItem(storageKey);

    if (isTheme(savedTheme)) {
      return savedTheme;
    }
  } catch {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getThemeSnapshot() {
  clientTheme ??= getPreferredTheme();

  return clientTheme;
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function subscribeToTheme(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function updateTheme(nextTheme: Theme) {
  clientTheme = nextTheme;
  document.documentElement.dataset.theme = nextTheme;

  try {
    window.localStorage.setItem(storageKey, nextTheme);
  } catch {
    // Keep the in-memory theme change even if storage is unavailable.
  }

  listeners.forEach((listener) => {
    listener();
  });
}

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <button
      aria-pressed={isDark}
      className="flex h-10 items-center justify-between gap-3 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
      onClick={() => updateTheme(isDark ? "light" : "dark")}
      type="button"
    >
      <span>{t("common.theme")}</span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full border border-[var(--border-strong)] transition",
          isDark ? "bg-[var(--brand-primary)]" : "bg-[var(--bg-base)]",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--bg-surface)] shadow-sm transition",
            isDark ? "left-4" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
