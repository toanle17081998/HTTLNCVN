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
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, cn } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useTranslation } from "@/providers/I18nProvider";
import { ChangePasswordModal } from "../auth/ChangePasswordModal";
import { ChurchLogo } from "./ChurchLogo";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { navItems, type NavItem } from "./navigation";
import { useSiteNavigationQuery, defaultSiteNavigationConfig } from "@/services/siteNavigation";
import { resolveIcon } from "@/components/page-builder/shared/iconList";

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
  const { t, locale } = useTranslation();
  const { can, canAny, isAuthenticated, logout, role, user } = useAuth();

  const siteNavQuery = useSiteNavigationQuery();
  const siteNav = siteNavQuery.data ?? defaultSiteNavigationConfig;
  const headerConfig = siteNav.header;

  const dynamicItems = !isAuthenticated && !siteNavQuery.data
    ? []
    : headerConfig.items.filter(
        (item) => item.visible !== false && (isAuthenticated || item.guestVisible !== false),
      );

  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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
    setIsAtTop(window.scrollY < 24);

    function updateHeaderVisibility() {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;
      const isScrollingDown = scrollDelta > 6;
      const isScrollingUp = scrollDelta < -1;
      const isNearTop = currentScrollY < 24;
      setIsAtTop(isNearTop);

      if (isNearTop || isScrollingUp) {
        setIsVisible(true);
      } else if (isScrollingDown) {
        setIsVisible(false);
      }

      lastScrollYRef.current = currentScrollY;
      tickingRef.current = false;
    }

    function onScroll() {
      if (!tickingRef.current) {
        window.requestAnimationFrame(updateHeaderVisibility);
        tickingRef.current = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
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

  function handleLogout() {
    setSettingsOpen(false);
    setMobileMenuOpen(false);
    logout();
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-all duration-300 ease-out",
        isAtTop ? "bg-[var(--header-hero-overlay)]" : "bg-[var(--header-scrolled-bg)] shadow-sm",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0 shadow-none",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 md:h-20 lg:px-8">
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
          <div className="flex items-center gap-1 lg:gap-2">
            {dynamicItems.map((item) => {
              const IconComp = resolveIcon(item.icon);
              const label = locale === "vi" ? item.labelVi || item.labelEn : item.labelEn || item.labelVi;
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "text-[var(--header-nav-active)] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-[var(--accent-gold)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--header-nav-hover)]",
                  )}
                  href={item.href}
                  key={item.id || item.href}
                >
                  <IconComp className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Header CTA Button */}
          {headerConfig.cta?.enabled && headerConfig.cta.href ? (
            <Link
              className="hidden lg:inline-flex"
              href={headerConfig.cta.href}
            >
              <Button size="sm" className="rounded-lg font-semibold">
                {locale === "vi"
                  ? headerConfig.cta.labelVi || headerConfig.cta.labelEn
                  : headerConfig.cta.labelEn || headerConfig.cta.labelVi}
              </Button>
            </Link>
          ) : null}

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
                          "w-full text-left p-3 transition-colors hover:bg-[var(--brand-muted)]/50 flex flex-col gap-1 rounded-xl",
                          !n.is_read && "bg-[var(--brand-muted)]/20 font-semibold"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-[var(--text-primary)] truncate">{n.title}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{n.body}</p>
                      </button>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                        {t("notification.empty.title")}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[var(--border-subtle)] p-1">
                    <Link
                      href="/notification"
                      onClick={() => setNotificationOpen(false)}
                      className="block w-full rounded-xl py-2 text-center text-xs font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-muted)] transition-colors"
                    >
                      {t("notification.title")}
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
              aria-label={t("nav.userMenu" as any)}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 px-3 py-1.5 text-left transition-all hover:border-[var(--brand-primary)] hover:bg-[var(--brand-muted)] active:scale-95 cursor-pointer shadow-xs",
                settingsOpen && "border-[var(--brand-primary)] bg-[var(--brand-muted)]",
              )}
              onClick={() => {
                setSettingsOpen((open) => !open);
                setNotificationOpen(false);
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <span className="text-xs font-bold leading-tight text-[var(--text-primary)] max-w-[11rem] truncate">
                {isAuthenticated ? user?.username || user?.email || "User" : t("nav.guest" as any)}
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-[var(--text-secondary)] transition-transform duration-200 shrink-0",
                  settingsOpen && "rotate-180",
                )}
              />
            </button>

            {settingsOpen && (
              <div
                className="animate-in fade-in zoom-in-95 absolute right-0 top-full z-50 mt-3 w-64 origin-top-right rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-2xl"
                role="menu"
              >
                {/* User Info / Role */}
                <div className="border-b border-[var(--border-subtle)] pb-3">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {isAuthenticated ? user?.email : t("nav.guest" as any)}
                  </p>
                  {role && (
                    <span className="mt-1.5 inline-flex items-center rounded-full bg-[var(--brand-muted)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--brand-primary)]">
                      {locale === "vi"
                        ? !isAuthenticated
                          ? t("nav.guest" as any)
                          : role === "SUPER_ADMIN"
                          ? "Tổng quản trị"
                          : role === "CHURCH_ADMIN"
                            ? "Quản trị hội thánh"
                            : role === "MINISTRY_LEADER"
                              ? "Trưởng ban ngành"
                              : role === "PASTOR"
                                ? "Mục sư"
                                : role === "EDITOR"
                                  ? "Biên tập viên"
                                  : "Thành viên"
                        : role.replaceAll("_", " ")}
                    </span>
                  )}
                </div>

                {/* Preferences: Language & Theme */}
                <div className="border-b border-[var(--border-subtle)] py-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      {t("nav.language" as any) || "Ngôn ngữ"}
                    </span>
                    <LanguageToggle />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      {t("nav.theme" as any) || "Giao diện"}
                    </span>
                    <ThemeToggle />
                  </div>
                </div>

                {/* Navigation / Actions */}
                <div className="pt-2 space-y-1">
                  {isAuthenticated ? (
                    <>
                      {canAny([
                        PERMISSIONS.manageArticle,
                        PERMISSIONS.manageEvents,
                        PERMISSIONS.manageCourses,
                        PERMISSIONS.manageChurchMembers,
                      ]) ? (
                        <Link
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                          href="/admin"
                          onClick={() => setSettingsOpen(false)}
                          role="menuitem"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          {t("nav.adminPortal" as any) || "Trang quản trị"}
                        </Link>
                      ) : null}
                      <button
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)] cursor-pointer"
                        onClick={() => {
                          setSettingsOpen(false);
                          setIsPasswordModalOpen(true);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        <Shield className="h-4 w-4" />
                        {t("nav.changePassword" as any) || t("settings.changePassword" as any)}
                      </button>
                      <button
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--status-danger)] transition hover:bg-[var(--status-danger-bg)] cursor-pointer"
                        onClick={handleLogout}
                        role="menuitem"
                        type="button"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("nav.logout")}
                      </button>
                    </>
                  ) : (
                    <Link
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--brand-primary)] transition hover:bg-[var(--brand-muted)]"
                      href="/auth"
                      onClick={() => setSettingsOpen(false)}
                      role="menuitem"
                    >
                      <LogIn className="h-4 w-4" />
                      {t("nav.login")}
                    </Link>
                  )}
                </div>
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
          {dynamicItems.map((item) => {
            const IconComp = resolveIcon(item.icon);
            const label = locale === "vi" ? item.labelVi || item.labelEn : item.labelEn || item.labelVi;
            const description = locale === "vi" ? item.descriptionVi : item.descriptionEn;
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id || item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-3 py-2 transition-all duration-200 active:scale-[0.98]",
                  isActive
                    ? "border-[var(--accent-gold)] text-[var(--header-nav-active)]"
                    : "border-transparent text-[var(--text-primary)] hover:text-[var(--header-nav-hover)]"
                )}
              >
                <div className="flex shrink-0 items-center justify-center text-[var(--brand-primary)]">
                  <IconComp className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{label}</span>
                  {description ? (
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                      {description}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}

          {headerConfig.cta?.enabled && headerConfig.cta.href ? (
            <div className="pt-2">
              <Link
                href={headerConfig.cta.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block"
              >
                <Button className="w-full rounded-xl">
                  {locale === "vi"
                    ? headerConfig.cta.labelVi || headerConfig.cta.labelEn
                    : headerConfig.cta.labelEn || headerConfig.cta.labelVi}
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </nav>

      {/* Change Password Modal */}
      {isAuthenticated ? (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      ) : null}
    </header>
  );
}
