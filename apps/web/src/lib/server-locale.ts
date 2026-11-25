import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

export const LOCALE_COOKIE = "httlncvn.locale";

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    if (cookieLocale && isLocale(cookieLocale)) {
      return cookieLocale;
    }

    const headerStore = await headers();
    const acceptLanguage = headerStore.get("accept-language")?.toLowerCase() ?? "";
    if (acceptLanguage) {
      const firstLang = acceptLanguage.split(",")[0]?.trim() ?? "";
      if (firstLang.startsWith("en")) return "en";
      if (firstLang.startsWith("vi")) return "vi";
    }
  } catch {
    // Fallback to default locale during static generation.
  }

  return defaultLocale;
}
