"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  BarChart3,
  FileStack,
  Users,
  Network,
  CalendarDays,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  ClipboardCheck,
  X,
  LogOut,
  ExternalLink,
  LayoutGrid,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { Button, cn, Title, Text } from "@/components/ui";
import { PERMISSIONS, useAuth } from "@/providers/AuthProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useTranslation } from "@/providers/I18nProvider";
import type { TranslationKey } from "@/lib/i18n";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LanguageToggle, Breadcrumb } from "@/components/layout";
import { useMediaStorageUsageQuery } from "@/api/media";

type AdminLayoutProps = {
  children: ReactNode;
};

type AdminLayoutChromeContextValue = {
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
  setViewSiteHref: (href: string | null) => void;
};

type AdminNavItem = {
  href: string;
  icon: LucideIcon;
  labelKey: TranslationKey;
};

const primaryNavItems: AdminNavItem[] = [
  { href: "/admin/pages", labelKey: "admin.nav.pages", icon: FileStack },
  { href: "/admin/media", labelKey: "admin.nav.media", icon: ImageIcon },
  { href: "/admin/navigation", labelKey: "admin.nav.navigation", icon: LayoutGrid },
  { href: "/admin/articles", labelKey: "nav.article.label", icon: BookOpen },
  { href: "/admin/courses", labelKey: "nav.course.label", icon: BarChart3 },
  { href: "/admin/tests", labelKey: "nav.test.label", icon: ClipboardCheck },
  { href: "/admin/church", labelKey: "nav.church.label", icon: Network },
  { href: "/admin/households", labelKey: "admin.nav.households", icon: Users },
  { href: "/admin/reports", labelKey: "admin.nav.reports", icon: ShieldCheck },
  { href: "/admin/serving-schedules/worship", labelKey: "nav.servingWorship.label", icon: CalendarDays },
  { href: "/admin/serving-schedules/cleaning", labelKey: "nav.servingCleaning.label", icon: CalendarDays },
];

function getViewSiteHref(pathname: string): string {
  const courseLessonMatch = pathname.match(/^\/admin\/courses\/([^/]+)\/lessons\/([^/]+)(?:\/|$)/);
  if (courseLessonMatch) {
    return `/course/${courseLessonMatch[1]}/lesson/${courseLessonMatch[2]}`;
  }

  const courseDetailMatch = pathname.match(/^\/admin\/courses\/([^/]+)\/edit(?:\/|$)/);
  if (courseDetailMatch) {
    return `/course/${courseDetailMatch[1]}`;
  }

  if (
    pathname.startsWith("/admin/courses") ||
    pathname.startsWith("/admin/lessons") ||
    pathname.startsWith("/admin/quizzes") ||
    pathname.startsWith("/admin/tests")
  ) {
    return "/course";
  }

  if (pathname.startsWith("/admin/articles")) {
    return "/article";
  }

  if (pathname.startsWith("/admin/church") || pathname.startsWith("/admin/households")) {
    return "/church";
  }

  return "/";
}

const AdminLayoutChromeContext = createContext<AdminLayoutChromeContextValue | null>(null);

export function useAdminLayoutChrome() {
  return useContext(AdminLayoutChromeContext);
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { confirm } = useFeedback();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewSiteHrefOverride, setViewSiteHref] = useState<string | null>(null);
  const { canAny, isAuthenticated, isLoading, logout, role, user } = useAuth();
  const viewSiteHref = viewSiteHrefOverride ?? getViewSiteHref(pathname);
  const chromeContextValue = useMemo(
    () => ({ isFullscreen, setIsFullscreen, setViewSiteHref }),
    [isFullscreen],
  );

  const canAccessAdmin = canAny([
    PERMISSIONS.manageAbout,
    PERMISSIONS.manageArticle,
    PERMISSIONS.createChurchUnits,
    PERMISSIONS.deleteChurchUnits,
    PERMISSIONS.createChurchMembers,
    PERMISSIONS.deleteChurchMembers,
    PERMISSIONS.manageChurchUnits,
    PERMISSIONS.manageChurchMembers,
    PERMISSIONS.manageCourses,
    PERMISSIONS.manageEvents,
    PERMISSIONS.manageSystemSettings,
    PERMISSIONS.updateChurchUnits,
    PERMISSIONS.updateChurchMembers,
  ]);
  const storageUsageQuery = useMediaStorageUsageQuery(canAccessAdmin && isAuthenticated);
  const storageUsage = storageUsageQuery.data;
  const usedGb = storageUsage ? (storageUsage.totalBytes / (1024 * 1024 * 1024)).toFixed(2) : null;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setIsFullscreen(false);
  }, [pathname]);

  async function handleLogout() {
    const ok = await confirm({
      confirmLabel: t("nav.logout"),
      description: t("confirm.logout.description"),
      title: t("confirm.logout.title"),
      variant: "warning",
    });
    if (!ok) return;
    logout();
  }

  function isNavItemActive(item: AdminNavItem) {
    return pathname.startsWith(item.href);
  }

  function renderNavItem(item: AdminNavItem) {
    const Icon = item.icon;
    const isActive = isNavItemActive(item);

    return (
      <Link
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-200",
          isSidebarCollapsed && "lg:justify-center",
          isActive
            ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-md shadow-[var(--brand-shadow)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]",
        )}
        href={item.href}
        key={item.href}
      >
        <Icon aria-hidden="true" className={cn("h-4 w-4 shrink-0", isActive ? "text-[var(--text-inverse)]" : "")} />
        <span className={cn("truncate", isSidebarCollapsed && "lg:hidden")}>{t(item.labelKey)}</span>
      </Link>
    );
  }

  return (
    <AdminLayoutChromeContext.Provider value={chromeContextValue}>
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
        {/* Mobile Backdrop */}
        {isMobileMenuOpen && !isFullscreen && canAccessAdmin && (
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
            style={{ backgroundColor: "var(--bg-scrim)" }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div className="flex min-h-screen">
          {/* Sidebar */}
          {canAccessAdmin && (
            <aside className={cn(
              "fixed inset-y-0 left-0 z-50 flex h-dvh w-[280px] flex-col overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
              isSidebarCollapsed && "lg:w-20",
              isFullscreen
                ? "-translate-x-full lg:hidden"
                : isMobileMenuOpen
                  ? "translate-x-0 shadow-[var(--shadow-lg)]"
                  : "-translate-x-full"
            )}>
              {/* Sidebar Header */}
              <div className={cn("flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6", isSidebarCollapsed && "lg:justify-center lg:px-2")}>
                <div className={cn("flex items-center gap-3", isSidebarCollapsed && "lg:hidden")}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-sm font-black text-[var(--text-inverse)] shadow-lg shadow-[var(--brand-shadow)]">
                    H
                  </div>
                  <div className="min-w-0">
                    <Text as="p" tone="inherit" variant="inherit" className="truncate text-sm font-bold tracking-tight text-[var(--text-primary)]">{t("admin.layout.title")}</Text>
                    <Text as="p" tone="inherit" variant="inherit" className="truncate text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] opacity-70">{t("admin.layout.contentManagement")}</Text>
                  </div>
                </div>
                <Button
                  variant="unstyled"
                  type="submit"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--brand-muted)] lg:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label={t("nav.closeNavigation")}
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </Button>
                <Button
                  variant="unstyled"
                  aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className="hidden h-9 w-9 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--brand-muted)] lg:inline-flex"
                  onClick={() => setIsSidebarCollapsed((current) => !current)}
                  title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  type="button"
                >
                  {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </Button>
              </div>

              {/* Navigation */}
              <nav aria-label={t("admin.common.admin")} className="flex-1 space-y-1.5 overflow-y-auto bg-[var(--bg-surface)] px-4 py-6">
                {primaryNavItems.map(renderNavItem)}
              </nav>

              {/* Sidebar Footer / User Profile */}
              <div className={cn("mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4", isSidebarCollapsed && "lg:hidden")}>
                <div className="group relative flex items-center gap-3 rounded-2xl bg-[var(--bg-base)] p-3 transition-colors hover:bg-[var(--brand-muted)]/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/5 text-sm font-bold">
                      {user?.email?.charAt(0).toUpperCase() || "A"}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Text as="p" tone="inherit" variant="inherit" className="truncate text-sm font-bold text-[var(--text-primary)]">{user?.email?.split("@")[0] || t("admin.layout.defaultUser")}</Text>
                    <Text as="p" tone="inherit" variant="inherit" className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{role || t("admin.layout.defaultRole")}</Text>
                  </div>
                  <Button
                    variant="unstyled"
                    type="submit"
                    onClick={handleLogout}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger)]"
                    title={t("nav.logout")}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </aside>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {!isFullscreen ? (
              <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 sm:h-16 sm:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
                  {canAccessAdmin && (
                    <Button
                      variant="unstyled"
                      aria-label="Open navigation"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] lg:hidden"
                      onClick={() => setIsMobileMenuOpen(true)}
                      type="button"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  )}
                  <div className="hidden min-w-0 flex-1 overflow-hidden md:block">
                    <Breadcrumb pathname={pathname} />
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                  <Link
                    aria-label={t("admin.common.viewSite")}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] md:w-auto md:gap-1.5 md:px-3"
                    href={viewSiteHref}
                    title={t("admin.common.viewSite")}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span className="hidden md:inline">{t("admin.common.viewSite")}</span>
                  </Link>
                  {isAuthenticated ? (
                    <Button
                      variant="unstyled"
                      aria-label={t("nav.logout")}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger)]"
                      onClick={handleLogout}
                      title={t("nav.logout")}
                      type="button"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--brand-primary)] px-3 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--brand-primary-strong)] sm:px-4"
                      href="/auth"
                    >
                      {t("nav.login")}
                    </Link>
                  )}
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </header>
            ) : null}

            <main className={cn("min-w-0 flex-1", isFullscreen ? "p-0" : "px-3 py-4 sm:px-5 sm:py-6 lg:px-6")}>
              <div className={cn("mx-auto w-full", isFullscreen ? "max-w-none" : "max-w-7xl")}>
                {isLoading ? (
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-sm">
                    <div className="h-6 w-48 animate-pulse rounded-lg bg-[var(--bg-base)]" />
                    <div className="mt-4 h-4 w-72 max-w-full animate-pulse rounded-lg bg-[var(--bg-base)]" />
                  </div>
                ) : canAccessAdmin ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {storageUsage?.exceedsLimit && usedGb ? (
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-4 py-3 text-sm text-[var(--status-warning-text)]"
                        role="alert"
                      >
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning-text)]" />
                          <div>
                            <p className="font-semibold">{t("admin.storage.warningTitle")}</p>
                            <p className="text-xs opacity-90">
                              {t("admin.storage.warningDescription", { size: usedGb })}
                            </p>
                          </div>
                        </div>
                        <Link
                          className="rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-1.5 text-xs font-semibold transition hover:brightness-95"
                          href="/admin/media"
                        >
                          {t("admin.storage.manageMedia")}
                        </Link>
                      </div>
                    ) : null}
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <Title as="h1" className="mt-6" variant="section">
                      {t("admin.layout.restrictedTitle")}
                    </Title>
                    <Text as="p" tone="inherit" variant="inherit" className="mx-auto mt-2 max-w-md text-base text-[var(--text-secondary)]">
                      {t("admin.layout.restrictedDescription")}
                    </Text>
                    <Link
                      className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-primary)] px-8 text-sm font-bold text-[var(--text-inverse)] transition hover:bg-[var(--brand-primary-strong)] shadow-lg shadow-[var(--brand-shadow)]"
                      href="/auth"
                    >
                      {t("nav.login")}
                    </Link>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AdminLayoutChromeContext.Provider>
  );
}
