import type { TranslationKey } from "@/lib/i18n";

export type SectionCategory = "Hero" | "Paragraph" | "Feature list" | "CTA" | "Gallery";
export type SectionPreset = { category: SectionCategory; id: string; name: string; variant: number };

const sectionVariantNames: Record<SectionCategory, string[]> = {
  Hero: ["Split image slider", "Centered welcome", "Split feature image"],
  Paragraph: ["1 Column", "2 Columns", "3 Columns", "Rich Text / Markdown"],
  "Feature list": ["Zig-zag cards", "Image card grid", "Tabbed ministries", "Community testimonials", "Centered icon grid", "Core values orbit"],
  CTA: ["Centered invitation", "Stay connected", "Split action", "Image-overlay action", "Accent invitation"],
  Gallery: ["Endless image loop", "Editorial feed", "Minimal feed", "Split-card feed", "Featured feed"],
};

export const sectionCategories = Object.keys(sectionVariantNames) as SectionCategory[];

export const sectionPresets: SectionPreset[] = sectionCategories.flatMap((category) =>
  sectionVariantNames[category].map((name, index) => ({
    category,
    id: `${category.toLowerCase().replace(" ", "-")}-${index + 1}`,
    name,
    variant: index + 1,
  })),
);

export const sectionCategoryKeys = {
  Hero: "pageBuilder.categoryHero",
  Paragraph: "pageBuilder.categoryParagraph",
  "Feature list": "pageBuilder.categoryFeatureList",
  CTA: "pageBuilder.categoryCta",
  Gallery: "pageBuilder.categoryGallery",
} as const satisfies Record<SectionCategory, TranslationKey>;

export function sectionPresetNameKey(preset: SectionPreset) {
  return `pageBuilder.preset.${preset.id}` as TranslationKey;
}

export function findSectionPreset(name: unknown) {
  return sectionPresets.find((preset) => preset.name === name);
}
