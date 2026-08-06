"use client";

import Link from "next/link";
import { useNotificationsQuery, useMarkNotificationReadMutation } from "@/services/notification";
import {
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Plus,
  Send,
  ChevronDown,
  LayoutDashboard,
  Info,
  BookOpen,
  GraduationCap,
  Calendar,
  Users,
  Bell,
  Heart,
  LogIn,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, cn } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useTranslation } from "@/providers/I18nProvider";
import { ChurchLogo } from "./ChurchLogo";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { navItems, type NavItem } from "./navigation";

type HeaderProps = {
  pathname: string;
};

const navIconMap: Record<string, React.ReactNode> = {
  "/": <LayoutDashboard className="h-4 w-4" />,
  "/about": <Info className="h-4 w-4" />,
  "/article": <BookOpen className="h-4 w-4" />,
  "/course": <GraduationCap className="h-4 w-4" />,
  "/event": <Calendar className="h-4 w-4" />,
  "/church": <ChurchLogo className="h-4 w-4" />,
  "/notification": <Bell className="h-4 w-4" />,
  "/prayer-journal": <Heart className="h-4 w-4" />,
  "/auth": <LogIn className="h-4 w-4" />,
};

export function Header({ pathname }: HeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { can, canAny, isAuthenticated, logout, role, user } = useAuth();

  const menuNavItems = navItems.filter(
    (item) =>
      item.href !== "/auth" &&
      (!item.permissions || canAny(item.permissions)),
  );

  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const canCreateContent = canAny([
    PERMISSIONS.manageArticle,
    PERMISSIONS.manageAbout,
    PERMISSIONS.manageCourses,
    PERMISSIONS.manageEvents,
  ]);
  const canPublish = can(PERMISSIONS.manageArticle);
  const showNotification = canAny([
    PERMISSIONS.personalizedSearch,
    PERMISSIONS.manageTelegramNotifications,
    PERMISSIONS.manageIntegrations,
  ]);

  const notificationsQuery = useNotificationsQuery(
    { take: 5, skip: 0 },
    isAuthenticated && showNotification
  );
  const markReadMutation = useMarkNotificationReadMutation();

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = (notification: any) => {
    setNotificationOpen(false);
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function updateHeaderVisibility() {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;
      const isScrollingDown = scrollDelta > 6;
      const isScrollingUp = scrollDelta < -1;
      const isNearTop = currentScrollY < 24;

      if (isNearTop || isScrollingUp) {
        setIsVisible(true);
      } else if (isScrollingDown) {
        setIsVisible(false);
      }

      lastScrollYRef.current = currentScrollY;
      tickingRef.current = false;
    }

    function handleScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(updateHeaderVisibility);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        settingsRef.current &&
        event.target instanceof Node &&
        !settingsRef.current.contains(event.target)
      ) {
        setSettingsOpen(false);
      }
      if (
        notificationRef.current &&
        event.target instanceof Node &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    }

    if (settingsOpen || notificationOpen) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [settingsOpen, notificationOpen]);

  function renderNavItem(item: NavItem, mobile = false) {
    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return (
      <Link
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "relative flex items-center gap-2 transition-colors duration-200",
          mobile
            ? "min-h-12 rounded-md px-4 text-sm font-semibold"
            : "px-3 py-2 text-sm font-medium",
          isActive
            ? "text-[var(--header-nav-active)] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-[var(--accent-gold)]"
            : "text-[var(--text-secondary)] hover:text-[var(--header-nav-hover)]",
        )}
        href={item.href}
        key={item.href}
        onClick={() => {
          setMobileMenuOpen(false);
        }}
      >
        {!mobile && navIconMap[item.href]}
        <span className="truncate">{t(item.labelKey)}</span>
      </Link>
    );
  }



  function handleLogout() {
    setSettingsOpen(false);
    setMobileMenuOpen(false);
    logout();
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-[var(--bg-surface)]/95 backdrop-blur-md transition-all duration-300 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0 shadow-none",
      )}
    >
      <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 md:h-20 lg:px-8">
        <Link
          aria-label={t("app.name")}
          className="flex shrink-0 items-center rounded-md transition-opacity hover:opacity-80"
          href="/"
        >
          <ChurchLogo className="h-10 w-10 md:h-14 md:w-14" />
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center md:flex"
          ref={navRef}
        >
          <div className="flex items-center gap-2">
            {menuNavItems.map((item) => renderNavItem(item))}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Notification Bell Button & Dropdown */}
          {showNotification && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setNotificationOpen((open) => !open);
                  setSettingsOpen(false);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)] active:scale-95",
                  (notificationOpen || pathname === "/notification") && "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                )}
                aria-label={t("nav.notification.label")}
                aria-expanded={notificationOpen}
                aria-haspopup="menu"
                type="button"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--status-danger)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--status-danger)]" />
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div
                  className="animate-in fade-in zoom-in-95 absolute right-0 top-full z-50 mt-3 w-80 origin-top-right rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 shadow-2xl"
                  role="menu"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      {t("nav.notification.label")}
                    </p>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-[var(--status-danger-bg)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--status-danger)]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto py-1 divide-y divide-[var(--border-subtle)]">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "flex w-full flex-col gap-1 px-3 py-2.5 text-left transition hover:bg-[var(--bg-base)]/50",
                          !n.is_read && "bg-[var(--brand-soft)]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn("text-xs font-bold truncate", !n.is_read ? "text-[var(--text-primary)] font-extrabold" : "text-[var(--text-secondary)]")}>
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-primary)]" />
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-tertiary)] line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[9px] text-[var(--text-tertiary)] opacity-60">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </button>
                    ))}

                    {notifications.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-xs font-medium text-[var(--text-tertiary)]">
                          No notifications
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[var(--border-subtle)] pt-1">
                    <Link
                      href="/notification"
                      onClick={() => setNotificationOpen(false)}
                      className="flex w-full items-center justify-center rounded-xl py-2 text-xs font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-muted)] transition"
                    >
                      See All
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Settings Dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              aria-expanded={settingsOpen}
              aria-haspopup="menu"
              className={cn(
                "flex h-10 items-center gap-2 px-2 text-sm font-semibold transition-colors hover:text-[var(--brand-primary)] active:scale-95 md:h-11 md:px-3",
                settingsOpen && "text-[var(--brand-primary)]"
              )}
              onClick={() => {
                setSettingsOpen((open) => !open);
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[10px] text-white md:h-7 md:w-7">
                {isAuthenticated ? (user?.username?.[0] ?? "U").toUpperCase() : <User className="h-3.5 w-3.5" />}
              </div>
              <span className="hidden max-w-[100px] truncate md:block">
                {isAuthenticated ? user?.username : t("nav.settings")}
              </span>
              <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", settingsOpen && "rotate-180")} />
            </button>

            {settingsOpen && (
              <div
                className="animate-in fade-in zoom-in-95 absolute right-0 top-full z-50 mt-3 w-64 origin-top-right bg-[var(--bg-surface)] p-2 shadow-2xl"
                role="menu"
              >
                {/* Profile Section */}
                <div className="px-3 py-3 mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                    {t("nav.access")}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[var(--brand-muted)] flex items-center justify-center text-[var(--brand-primary)] font-bold">
                      {(user?.username?.[0] ?? "P").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {user?.username ?? t("nav.publicBrowsing")}
                      </p>
                      <p className="text-[10px] font-medium text-[var(--text-secondary)]">
                        {role}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-[var(--border-subtle)] mx-2 my-1" />

                {/* Preferences Section */}
                <div className="p-2 space-y-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">{t("common.language")}</span>
                    <LanguageToggle />
                  </div>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">{t("common.theme")}</span>
                    <ThemeToggle />
                  </div>
                </div>

                <div className="h-px bg-[var(--border-subtle)] mx-2 my-1" />

                {/* Actions Section */}
                <div className="p-1 space-y-1">
                  {canCreateContent && (
                    <Link
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                      href="/admin"
                      onClick={() => setSettingsOpen(false)}
                      role="menuitem"
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}

                  {isAuthenticated ? (
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--status-danger)] transition hover:bg-[var(--status-danger-bg)]"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("nav.logout")}
                    </button>
                  ) : (
                    <Link
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--brand-primary)] transition hover:bg-[var(--brand-muted)]"
                      href="/auth"
                      onClick={() => setSettingsOpen(false)}
                      role="menuitem"
                    >
                      <LogIn className="h-4 w-4" />
                      {t("nav.login")}
                    </Link>
                  )}
                </div>

                {/* Admin Quick Actions */}
                {(canCreateContent || canPublish) && (
                  <>
                    <div className="h-px bg-[var(--border-subtle)] mx-2 my-1" />
                    <div className="p-1 grid grid-cols-2 gap-1">
                      {canCreateContent && (
                        <Button size="sm" variant="secondary" className="h-9 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          <Plus className="h-3 w-3 mr-1" />
                          {t("action.newItem")}
                        </Button>
                      )}
                      {canPublish && (
                        <Button size="sm" className="h-9 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          <Send className="h-3 w-3 mr-1" />
                          {t("action.publish")}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>


          {/* Mobile Menu Toggle */}
          <button
            aria-controls="mobile-primary-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t("nav.closeNavigation") : t("nav.openNavigation")}
            className="flex h-10 w-10 items-center justify-center text-[var(--text-primary)] transition-colors hover:text-[var(--brand-primary)] active:scale-95 md:hidden"
            onClick={() => {
              setMobileMenuOpen((open) => !open);
              setSettingsOpen(false);
            }}
            type="button"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <nav
          aria-hidden={!mobileMenuOpen}
          aria-label="Primary"
          className={cn(
            "overflow-y-auto bg-[var(--bg-surface)] px-4 transition-all duration-300 ease-out sm:px-6 md:hidden",
            mobileMenuOpen
              ? "max-h-[calc(100dvh-4rem)] py-3 opacity-100 shadow-xl"
              : "pointer-events-none max-h-0 py-0 opacity-0",
          )}
          id="mobile-primary-navigation"
          inert={!mobileMenuOpen}
        >
          <div className="grid gap-2">
            {menuNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-3 py-2 transition-all duration-200 active:scale-[0.98]",
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    ? "border-[var(--accent-gold)] text-[var(--header-nav-active)]"
                    : "border-transparent text-[var(--text-primary)] hover:text-[var(--header-nav-hover)]"
                )}
              >
                <div className="flex shrink-0 items-center justify-center text-[var(--brand-primary)]">
                  {navIconMap[item.href] || <Menu className="h-5 w-5" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{t(item.labelKey)}</span>
                  <span className={cn(
                    "text-[10px] font-medium",
                    pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                      ? "text-[var(--text-secondary)]"
                      : "text-[var(--text-secondary)]"
                  )}>
                    {t(item.descriptionKey)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </nav>
    </header>
  );
}
