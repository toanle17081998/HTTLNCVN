import type { TranslationKey } from "@/lib/i18n";
import { PERMISSIONS, type Permission } from "@/lib/rbac";

export type NavItem = {
  href: string;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  permissions?: readonly Permission[];
};

export const navItems: NavItem[] = [
  {
    href: "/",
    labelKey: "nav.dashboard.label",
    descriptionKey: "nav.dashboard.description",
    permissions: [PERMISSIONS.viewLanding],
  },
  {
    href: "/about",
    labelKey: "nav.about.label",
    descriptionKey: "nav.about.description",
    permissions: [PERMISSIONS.viewAbout],
  },
  {
    href: "/article",
    labelKey: "nav.article.label",
    descriptionKey: "nav.article.description",
    permissions: [PERMISSIONS.viewPublicArticle],
  },
  {
    href: "/course",
    labelKey: "nav.course.label",
    descriptionKey: "nav.course.description",
    permissions: [PERMISSIONS.viewLanding],
  },
  {
    href: "/event",
    labelKey: "nav.event.label",
    descriptionKey: "nav.event.description",
    permissions: [PERMISSIONS.viewEvents],
  },
  {
    href: "/member",
    labelKey: "nav.member.label",
    descriptionKey: "nav.member.description",
    permissions: [PERMISSIONS.manageChurchMembers],
  },
  {
    href: "/notification",
    labelKey: "nav.notification.label",
    descriptionKey: "nav.notification.description",
    permissions: [
      PERMISSIONS.personalizedSearch,
      PERMISSIONS.manageTelegramNotifications,
      PERMISSIONS.manageIntegrations,
    ],
  },
  {
    href: "/prayer-journal",
    labelKey: "nav.prayerJournal.label",
    descriptionKey: "nav.prayerJournal.description",
    permissions: [
      PERMISSIONS.manageOwnPrayers,
      PERMISSIONS.moderateChurchPrayers,
      PERMISSIONS.viewAllData,
    ],
  },
  {
    href: "/auth",
    labelKey: "nav.auth.label",
    descriptionKey: "nav.auth.description",
    permissions: [PERMISSIONS.viewLanding],
  },
];

export function getActiveNavItem(pathname: string) {
  return (
    navItems.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ) ?? navItems[0]
  );
}
