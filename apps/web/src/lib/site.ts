import type { Metadata } from "next";

export const siteConfig = {
  description: "Learn, gather, and grow with the HTNC community through articles, courses, events, and church resources.",
  name: "HTNC Platform",
  shortName: "HTNC",
} as const;

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return new URL(configuredUrl || "http://localhost:3000");
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export function createPageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, type: "website", url: path },
    twitter: { title, description },
  };
}

export function summarizeText(value: string, length = 160) {
  const plainText = value
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~\[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plainText.length > length ? `${plainText.slice(0, length - 3).trimEnd()}...` : plainText;
}
