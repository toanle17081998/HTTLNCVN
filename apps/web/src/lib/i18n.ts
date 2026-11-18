import enMessages from "@/i18n/en.json";
import viMessages from "@/i18n/vi.json";

export const locales = ["en", "vi"] as const;

export type Locale = (typeof locales)[number];
export type TranslationKey = keyof typeof enMessages;

export const defaultLocale: Locale = "vi";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
};

export const messages = {
  en: enMessages,
  vi: viMessages satisfies Record<TranslationKey, string>,
} as const;

export function getLocalizedField(
  record: object | null | undefined,
  field: string,
  locale: Locale = defaultLocale,
  fallback = "",
): string {
  if (!record) return fallback;
  const values = record as Record<string, unknown>;
  const read = (candidate: Locale) => {
    const snakeCase = values[`${field}_${candidate}`];
    const camelCase = values[`${field}${candidate[0].toUpperCase()}${candidate.slice(1)}`];
    const value = snakeCase || camelCase;
    return typeof value === "string" ? value : "";
  };

  return read(locale) || read(defaultLocale) || locales.map(read).find(Boolean) || fallback;
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
