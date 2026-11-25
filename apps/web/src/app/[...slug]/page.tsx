import { cache } from "react";
import type { Metadata } from "next";
import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";
import { getLocalizedField } from "@/lib/i18n";
import { summarizeText } from "@/lib/site";
import { pageApi } from "@/api/page";

type CatchAllProps = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ previewLanguage?: string }>;
};

const getResolvedPage = cache((path: string) => pageApi.resolve(path).catch(() => null));

export async function generateMetadata({ params }: CatchAllProps): Promise<Metadata> {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;
  const page = await getResolvedPage(path);
  if (!page) {
    return { title: "Page", robots: { index: false } };
  }
  const title = getLocalizedField(page, "title");
  const description = summarizeText(getLocalizedField(page, "content")) || title;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, type: "website", url: path },
    twitter: { title, description },
  };
}

export default async function CatchAllPage({
  params,
  searchParams,
}: CatchAllProps) {
  const { slug } = await params;
  const { previewLanguage } = await searchParams;
  const language = previewLanguage === "en" || previewLanguage === "vi" ? previewLanguage : undefined;
  const path = `/${slug.join("/")}`;
  const page = await getResolvedPage(path);

  return <CraftPageRenderer initialPage={page} path={path} previewLanguage={language} />;
}
