"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, cn } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useTranslation } from "@/providers/I18nProvider";
import { ChurchLogo } from "./ChurchLogo";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { navItems } from "./navigation";

type HeaderProps = {
  pathname: string;
};

export function Header({ pathname }: HeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    can,
    canAny,
    isAuthenticated,
    logout,
    role,
    user,
  } = useAuth();
  const settingsNavItem = navItems.find((item) => item.href === "/auth");
  const menuNavItems = navItems.filter(
    (item) =>
      item.href !== "/auth" &&
      (!item.permissions || canAny(item.permissions)),
  );
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const canCreateContent = canAny([
    PERMISSIONS.manageArticle,
    PERMISSIONS.manageAbout,
    PERMISSIONS.manageCourses,
    PERMISSIONS.manageEvents,
  ]);
  const canPublish = can(PERMISSIONS.manageArticle);

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
      if (tickingRef.current) {
        return;
      }

      tickingRef.current = true;
      window.requestAnimationFrame(updateHeaderVisibility);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
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
    }

    if (settingsOpen) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [settingsOpen]);

  function renderNavLinks({ mobile = false }: { mobile?: boolean } = {}) {
    return menuNavItems.map((item) => {
      const isActive =
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

      return (
        <Link
          aria-current={isActive ? "page" : undefined}
          className={cn(
            mobile
              ? "flex min-h-11 items-center rounded-md px-3 text-sm font-semibold transition"
              : "min-w-0 rounded-md px-2 py-2 text-center text-xs font-semibold transition sm:px-3 sm:text-sm",
            isActive
              ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]",
          )}
          href={item.href}
          key={item.href}
          onClick={() => {
            if (mobile) {
              setMobileMenuOpen(false);
            }
          }}
        >
          <span className="block truncate">{t(item.labelKey)}</span>
        </Link>
      );
    });
  }

  function handleLogout() {
    logout();
    setSettingsOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/95 shadow-sm backdrop-blur transition-[opacity,transform,box-shadow] duration-300 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0 shadow-none",
      )}
    >
      <div className="relative flex min-h-16 items-center gap-3 px-4 py-3 sm:px-6 md:h-20 md:gap-4">
        <Link
          aria-label={t("app.name")}
          className="flex shrink-0 items-center rounded-md"
          href="/"
        >
          <ChurchLogo className="h-14 w-14 drop-shadow-sm md:h-20 md:w-20" />
        </Link>

        <nav
          aria-label="Primary"
          className="mx-auto hidden w-full max-w-5xl min-w-0 flex-nowrap justify-center gap-1 md:flex"
        >
          {renderNavLinks()}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            aria-controls="mobile-primary-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t("nav.closeNavigation") : t("nav.openNavigation")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)] md:hidden"
            onClick={() => {
              setMobileMenuOpen((open) => !open);
              setSettingsOpen(false);
            }}
            type="button"
          >
            {mobileMenuOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>

          <div className="relative shrink-0" ref={settingsRef}>
            <button
              aria-expanded={settingsOpen}
              aria-haspopup="menu"
              className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
              onClick={() => {
                setSettingsOpen((open) => !open);
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              {t("nav.settings")}
            </button>

            {settingsOpen ? (
              <div
                className="absolute right-0 top-full z-30 mt-2 grid w-56 gap-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-lg"
                role="menu"
              >
                <LanguageToggle />
                <ThemeToggle />
                <div className="rounded-md border border-[var(--border-subtle)] px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
                    {t("nav.access")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                    {role}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {user?.email ?? t("nav.publicBrowsing")}
                  </p>
                </div>
                {settingsNavItem ? (
                  <Link
                    className="flex h-10 items-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                    href={settingsNavItem.href}
                    onClick={() => setSettingsOpen(false)}
                    role="menuitem"
                  >
                    {t("nav.accessFlow")}
                  </Link>
                ) : null}
                {canCreateContent ? (
                  <Link
                    className="flex h-10 items-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                    href="/admin"
                    onClick={() => setSettingsOpen(false)}
                    role="menuitem"
                  >
                    Admin
                  </Link>
                ) : null}
                {isAuthenticated ? (
                  <Button onClick={handleLogout} size="sm" variant="secondary">
                    {t("nav.logout")}
                  </Button>
                ) : (
                  <Link
                    className="inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-[var(--btn-primary-bg)] px-3 text-sm font-semibold text-[var(--btn-primary-text)] shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                    href="/auth"
                  >
                    {t("nav.login")}
                  </Link>
                )}
                {canCreateContent ? (
                  <Button size="sm" variant="secondary">
                    {t("action.newItem")}
                  </Button>
                ) : null}
                {canPublish ? (
                  <Button size="sm">{t("action.publish")}</Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {mobileMenuOpen ? (
        <nav
          aria-label="Primary"
          className="grid gap-1 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 shadow-sm md:hidden"
          id="mobile-primary-navigation"
        >
          {renderNavLinks({ mobile: true })}
        </nav>
      ) : null}
    </header>
  );
}
