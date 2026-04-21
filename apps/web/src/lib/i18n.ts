import enMessages from "@/locales/en.json";
import viMessages from "@/locales/vi.json";

export const locales = ["en", "vi"] as const;

export type Locale = (typeof locales)[number];
export type TranslationKey = keyof typeof enMessages;

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
};

export const messages = {
  en: enMessages,
  vi: viMessages satisfies Record<TranslationKey, string>,
} as const;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
