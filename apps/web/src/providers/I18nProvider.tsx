"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  defaultLocale,
  isLocale,
  messages,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const storageKey = "httlncvn.locale";
const listeners = new Set<() => void>();
let clientLocale: Locale | null = null;

type I18nProviderProps = {
  children: ReactNode;
};

function getBrowserLocale() {
  const browserLocale = window.navigator.language.split("-")[0];

  return isLocale(browserLocale) ? browserLocale : defaultLocale;
}

function getPreferredLocale() {
  try {
    const savedLocale = window.localStorage.getItem(storageKey);

    if (savedLocale && isLocale(savedLocale)) {
      return savedLocale;
    }
  } catch {
    return getBrowserLocale();
  }

  return getBrowserLocale();
}

function getLocaleSnapshot() {
  clientLocale ??= getPreferredLocale();

  return clientLocale;
}

function getServerLocaleSnapshot() {
  return defaultLocale;
}

function subscribeToLocale(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function updateClientLocale(nextLocale: Locale) {
  clientLocale = nextLocale;

  listeners.forEach((listener) => {
    listener();
  });
}

export function I18nProvider({ children }: I18nProviderProps) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale(nextLocale: Locale) {
        updateClientLocale(nextLocale);

        try {
          window.localStorage.setItem(storageKey, nextLocale);
        } catch {
          // Keep the in-memory language change even if storage is unavailable.
        }
        document.documentElement.lang = nextLocale;
      },
      t(key: TranslationKey, params?: Record<string, string>) {
        let value: string = messages[locale][key] ?? messages[defaultLocale][key];

        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            value = value.replaceAll(`{${k}}`, v);
          });
        }

        return value;
      },
    };
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }

  return context;
}

export const useI18n = useTranslation;
