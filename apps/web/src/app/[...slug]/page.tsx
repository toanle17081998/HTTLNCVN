import type { Metadata } from "next";
import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";
import { getLocalizedField } from "@/lib/i18n";
import { summarizeText } from "@/lib/site";
import { pageApi } from "@/services/page";

type CatchAllProps = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ previewLanguage?: string }>;
};

export async function generateMetadata({ params }: CatchAllProps): Promise<Metadata> {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;
  try {
    const page = await pageApi.resolve(path);
    const title = getLocalizedField(page, "title");
    const description = summarizeText(getLocalizedField(page, "content")) || title;
    return {
      title,
      description,
      alternates: { canonical: path },
      openGraph: { title, description, type: "website", url: path },
      twitter: { title, description },
    };
  } catch {
    return { title: "Page", robots: { index: false } };
  }
}

export default async function CatchAllPage({
  params,
  searchParams,
}: CatchAllProps) {
  const { slug } = await params;
  const { previewLanguage } = await searchParams;
  const language = previewLanguage === "en" || previewLanguage === "vi" ? previewLanguage : undefined;

  return <CraftPageRenderer path={`/${slug.join("/")}`} previewLanguage={language} />;
}
