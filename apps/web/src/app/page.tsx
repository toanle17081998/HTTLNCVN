import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ previewLanguage?: string }>;
}) {
  const { previewLanguage } = await searchParams;
  const language = previewLanguage === "en" || previewLanguage === "vi" ? previewLanguage : undefined;

  return <CraftPageRenderer path="/" previewLanguage={language} />;
}
