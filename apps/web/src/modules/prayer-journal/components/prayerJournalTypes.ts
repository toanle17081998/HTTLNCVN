import type { Prayer, PrayerCategory, PrayerVisibility } from "@/mockData";
import { memberMockData } from "@/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrayerForm = {
  title: string;
  content: string;
  visibility: PrayerVisibility;
  category_id: number | "";
};

export type StatusFilter = "all" | "open" | "closed";
export type VisibilityFilter = "all" | PrayerVisibility;
export type ModalMode = "create" | "edit" | "view" | "close";

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function createEmptyForm(): PrayerForm {
  return { title: "", content: "", visibility: "private", category_id: "" };
}

export function prayerToForm(prayer: Prayer): PrayerForm {
  return {
    title: prayer.title ?? "",
    content: prayer.content,
    visibility: prayer.visibility,
    category_id: prayer.category_id ?? "",
  };
}

export function formatRelativeDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function getMemberName(id: string): string {
  const member = memberMockData.find((m) => m.id === id);
  return member?.display_name ?? member?.full_name ?? "Unknown";
}

export function getCategoryName(
  id: number | null,
  categories: PrayerCategory[],
): string | null {
  if (id === null) return null;
  return categories.find((c) => c.id === id)?.name ?? null;
}
