"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  BookOpen,
  BarChart3,
  FileStack,
  Users,
  Network,
  Menu,
  ShieldCheck,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Button, cn } from "@/components/ui";
import { PERMISSIONS, useAuth } from "@/providers/AuthProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useTranslation } from "@/providers/I18nProvider";
import type { TranslationKey } from "@/lib/i18n";
import { ErrorBoundary } from "@/components/ErrorBoundary";

type AdminLayoutProps = {
  children: ReactNode;
};

type AdminLayoutChromeContextValue = {
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
};

type AdminNavItem = {
  href: string;
  icon: LucideIcon;
  labelKey: TranslationKey;
};

const primaryNavItems: AdminNavItem[] = [
  { href: "/admin/pages", labelKey: "admin.nav.pages", icon: FileStack },
  { href: "/admin/articles", labelKey: "nav.article.label", icon: BookOpen },
  { href: "/admin/courses", labelKey: "nav.course.label", icon: BarChart3 },
  { href: "/admin/church-unit", labelKey: "nav.churchUnit.label", icon: Network },
  { href: "/admin/member", labelKey: "nav.member.label", icon: Users },
];

const AdminLayoutChromeContext = createContext<AdminLayoutChromeContextValue | null>(null);

export function useAdminLayoutChrome() {
  return useContext(AdminLayoutChromeContext);
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { canAny, isAuthenticated, isLoading, logout, role, user } = useAuth();

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setIsFullscreen(false);
  }, [pathname]);

  function handleLogout() {
    logout();
    router.push("/");
    router.refresh();
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
          isActive
            ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-md shadow-[var(--brand-shadow)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]",
        )}
        href={item.href}
        key={item.href}
      >
        <Icon aria-hidden="true" className={cn("h-4 w-4 shrink-0", isActive ? "text-[var(--text-inverse)]" : "")} />
        <span className="truncate">{t(item.labelKey)}</span>
      </Link>
    );
  }

  return (
    <AdminLayoutChromeContext.Provider value={{ isFullscreen, setIsFullscreen }}>
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
              "fixed inset-y-0 left-0 z-50 flex h-dvh w-[280px] flex-col overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
              isFullscreen
                ? "-translate-x-full lg:hidden"
                : isMobileMenuOpen
                  ? "translate-x-0 shadow-[var(--shadow-lg)]"
                  : "-translate-x-full"
            )}>
              {/* Sidebar Header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-sm font-black text-[var(--text-inverse)] shadow-lg shadow-[var(--brand-shadow)]">
                    H
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold tracking-tight text-[var(--text-primary)]">{t("admin.layout.title")}</p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] opacity-70">{t("admin.layout.contentManagement")}</p>
                  </div>
                </div>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--brand-muted)] lg:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label={t("nav.closeNavigation")}
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav aria-label={t("admin.common.admin")} className="flex-1 space-y-1.5 overflow-y-auto bg-[var(--bg-surface)] px-4 py-6">
                {primaryNavItems.map(renderNavItem)}
              </nav>

              {/* Sidebar Footer / User Profile */}
              <div className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <div className="group relative flex items-center gap-3 rounded-2xl bg-[var(--bg-base)] p-3 transition-colors hover:bg-[var(--brand-muted)]/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/5 text-sm font-bold">
                      {user?.email?.charAt(0).toUpperCase() || "A"}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">{user?.email?.split("@")[0] || t("admin.layout.defaultUser")}</p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{role || t("admin.layout.defaultRole")}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger)]"
                    title={t("nav.logout")}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </aside>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {!isFullscreen ? (
              <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6">
                <div className="flex items-center gap-4">
                  {canAccessAdmin && (
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] lg:hidden"
                      onClick={() => setIsMobileMenuOpen(true)}
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                  )}
                  <div className="hidden min-w-0 sm:block">
                    <p className="truncate text-sm font-bold">{t("admin.layout.dashboard")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <Link
                    className="hidden h-9 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] sm:inline-flex"
                    href="/"
                  >
                    {t("admin.common.viewSite")}
                  </Link>
                  {isAuthenticated ? (
                    <Button onClick={handleLogout} size="sm" variant="secondary" className="rounded-lg">
                      {t("nav.logout")}
                    </Button>
                  ) : (
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--brand-primary-strong)]"
                      href="/auth"
                    >
                      {t("nav.login")}
                    </Link>
                  )}
                </div>
              </header>
            ) : null}

            <main className={cn("min-w-0 flex-1", isFullscreen ? "p-0" : "p-4 sm:p-6 lg:p-8")}>
              <div className={cn("mx-auto w-full", isFullscreen ? "max-w-none" : "max-w-7xl")}>
                {isLoading ? (
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-sm">
                    <div className="h-6 w-48 animate-pulse rounded-lg bg-[var(--bg-base)]" />
                    <div className="mt-4 h-4 w-72 max-w-full animate-pulse rounded-lg bg-[var(--bg-base)]" />
                  </div>
                ) : canAccessAdmin ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                      {t("admin.layout.restrictedTitle")}
                    </h1>
                    <p className="mx-auto mt-2 max-w-md text-base text-[var(--text-secondary)]">
                      {t("admin.layout.restrictedDescription")}
                    </p>
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
