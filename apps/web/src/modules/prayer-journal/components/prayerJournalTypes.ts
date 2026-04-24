import type {
  Prayer,
  PrayerCategory,
  PrayerMember,
  PrayerVisibility,
} from "@services/prayer-journal";

export type PrayerForm = {
  content: string;
  selected_member_ids: string[];
  title: string;
  visibility: PrayerVisibility;
  category_id: number | "";
};

export type StatusFilter = "all" | "open" | "closed";
export type VisibilityFilter = "all" | PrayerVisibility;
export type ModalMode = "create" | "edit" | "view" | "close";

export function createEmptyForm(): PrayerForm {
  return {
    category_id: "",
    content: "",
    selected_member_ids: [],
    title: "",
    visibility: "private",
  };
}

export function prayerToForm(prayer: Prayer): PrayerForm {
  return {
    category_id: prayer.category?.id ?? "",
    content: prayer.content,
    selected_member_ids: prayer.shared_with.map((member) => member.id),
    title: prayer.title ?? "",
    visibility: prayer.visibility,
  };
}

export function formatPrayerDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function getCategoryName(
  category: PrayerCategory | null | undefined,
  categories: PrayerCategory[],
): string | null {
  if (category) {
    return category.name;
  }

  return null;
}

export function getMemberNames(memberIds: string[], members: PrayerMember[]): string {
  const names = memberIds
    .map((memberId) => members.find((member) => member.id === memberId)?.display_name)
    .filter(Boolean);

  return names.join(", ");
}
