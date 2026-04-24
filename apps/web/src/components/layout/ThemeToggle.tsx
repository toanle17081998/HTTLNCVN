"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
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

export function ThemeInitializer() {
  useEffect(() => {
    const theme = getThemeSnapshot();
    document.documentElement.dataset.theme = theme;
  }, []);

  return null;
}

export function ThemeToggle() {
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
      aria-label="Toggle Theme"
      aria-pressed={isDark}
      className="group relative flex h-7 w-12 items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] p-1 transition-all duration-300 hover:border-[var(--brand-primary)]"
      onClick={() => updateTheme(isDark ? "light" : "dark")}
      type="button"
    >
      <div
        className={cn(
          "flex h-5 w-5 transform items-center justify-center rounded-full shadow-md transition-all duration-300",
          isDark
            ? "translate-x-5 bg-[var(--brand-primary)] text-white"
            : "translate-x-0 bg-white text-[var(--brand-primary)]"
        )}
      >
        {isDark ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
      </div>
    </button>
  );
}
