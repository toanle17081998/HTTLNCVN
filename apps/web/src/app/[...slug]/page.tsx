import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";

export default async function CatchAllPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ previewLanguage?: string }>;
}) {
  const { slug } = await params;
  const { previewLanguage } = await searchParams;
  const language = previewLanguage === "en" || previewLanguage === "vi" ? previewLanguage : undefined;

  return <CraftPageRenderer path={`/${slug.join("/")}`} previewLanguage={language} />;
}
