import type { Metadata } from "next";
import { pageApi } from "@/api/page";
import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";
import { createPageMetadata, siteConfig } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(siteConfig.name, siteConfig.description, "/");

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ previewLanguage?: string }>;
}) {
  const { previewLanguage } = await searchParams;
  const language = previewLanguage === "en" || previewLanguage === "vi" ? previewLanguage : undefined;
  const initialPage = await pageApi.resolve("/").catch(() => null);

  return <CraftPageRenderer initialPage={initialPage} path="/" previewLanguage={language} />;
}
