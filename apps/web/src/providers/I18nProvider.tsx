"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const storageKey = "httlncvn.locale";

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return defaultLocale;
    }

    const savedLocale = window.localStorage.getItem(storageKey);

    if (savedLocale && isLocale(savedLocale)) {
      return savedLocale;
    }

    const browserLocale = window.navigator.language.split("-")[0];

    if (isLocale(browserLocale)) {
      return browserLocale;
    }

    return defaultLocale;
  });

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale(nextLocale) {
        setLocaleState(nextLocale);
        window.localStorage.setItem(storageKey, nextLocale);
        document.documentElement.lang = nextLocale;
      },
      t(key) {
        return messages[locale][key] ?? messages[defaultLocale][key];
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
