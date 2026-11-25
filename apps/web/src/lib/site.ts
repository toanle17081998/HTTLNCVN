import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";

export const siteConfig = {
  description:
    "Hội Thánh Tin Lành Nhân Cấp (HTTLNC) — học hỏi Lời Chúa, kết nối cộng đồng qua bài viết, khóa học Kinh Thánh, sự kiện và tài nguyên Hội Thánh.",
  descriptions: {
    vi: "Hội Thánh Tin Lành Nhân Cấp (HTTLNC) — học hỏi Lời Chúa, kết nối cộng đồng qua bài viết, khóa học Kinh Thánh, sự kiện và tài nguyên Hội Thánh.",
    en: "Multiplying Evangelical Church (MEC) — learn God's Word, gather, and grow together through articles, Bible courses, events, and church resources.",
  },
  name: "Hội Thánh Tin Lành Nhân Cấp",
  names: {
    vi: "Hội Thánh Tin Lành Nhân Cấp",
    en: "Multiplying Evangelical Church",
  },
  shortName: "HTTLNC",
  shortNames: {
    vi: "HTTLNC",
    en: "MEC",
  },
} as const;

export function getSiteName(locale: Locale = "vi") {
  return siteConfig.names[locale];
}

export function getSiteShortName(locale: Locale = "vi") {
  return siteConfig.shortNames[locale];
}

export function getSiteDescription(locale: Locale = "vi") {
  return siteConfig.descriptions[locale];
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return new URL(configuredUrl || "http://localhost:3000");
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export function createPageMetadata(
  title: string,
  description: string,
  path: string,
  locale: Locale = "vi",
): Metadata {
  const siteName = getSiteName(locale);
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: { vi: path, en: path, "x-default": path },
    },
    openGraph: {
      title,
      description,
      locale: locale === "en" ? "en_US" : "vi_VN",
      alternateLocale: [locale === "en" ? "vi_VN" : "en_US"],
      siteName,
      type: "website",
      url: path,
      images: [{ url: "/church-logo.png", alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/church-logo.png"],
    },
  };
}

export function createBilingualPageMetadata(
  content: Record<Locale, { title: string; description: string }>,
  path: string,
  locale: Locale = "vi",
): Metadata {
  const active = content[locale];
  return createPageMetadata(active.title, active.description, path, locale);
}

export function summarizeText(value: string, length = 160) {
  const plainText = value
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~\[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plainText.length > length ? `${plainText.slice(0, length - 3).trimEnd()}...` : plainText;
}
