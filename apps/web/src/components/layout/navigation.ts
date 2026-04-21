import type { TranslationKey } from "@/lib/i18n";

export type NavItem = {
  href: string;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
};

export const navItems: NavItem[] = [
  {
    href: "/",
    labelKey: "nav.dashboard.label",
    descriptionKey: "nav.dashboard.description",
  },
  {
    href: "/auth",
    labelKey: "nav.auth.label",
    descriptionKey: "nav.auth.description",
  },
  {
    href: "/member",
    labelKey: "nav.member.label",
    descriptionKey: "nav.member.description",
  },
  {
    href: "/blog",
    labelKey: "nav.blog.label",
    descriptionKey: "nav.blog.description",
  },
  {
    href: "/course",
    labelKey: "nav.course.label",
    descriptionKey: "nav.course.description",
  },
  {
    href: "/event",
    labelKey: "nav.event.label",
    descriptionKey: "nav.event.description",
  },
  {
    href: "/notification",
    labelKey: "nav.notification.label",
    descriptionKey: "nav.notification.description",
  },
  {
    href: "/prayer-journal",
    labelKey: "nav.prayerJournal.label",
    descriptionKey: "nav.prayerJournal.description",
  },
];

export function getActiveNavItem(pathname: string) {
  return (
    navItems.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ) ?? navItems[0]
  );
}
