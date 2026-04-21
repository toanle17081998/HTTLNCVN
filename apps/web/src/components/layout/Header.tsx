"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, cn } from "@/components/ui";
import { accessProfiles, useAuth, type AccessRole } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { navItems } from "./navigation";

type HeaderProps = {
  pathname: string;
};

export function Header({ pathname }: HeaderProps) {
  const { t } = useTranslation();
  const { accessRole, currentProfile, isAuthenticated, logout, switchRole, user } =
    useAuth();
  const settingsNavItem = navItems.find((item) => item.href === "/auth");
  const menuNavItems = navItems.filter((item) => item.href !== "/auth");
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const roleOptions = Object.values(accessProfiles);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function updateHeaderVisibility() {
      const currentScrollY = window.scrollY;
      const isScrollingUp = currentScrollY < lastScrollYRef.current;
      const isNearTop = currentScrollY < 24;

      setIsVisible(isScrollingUp || isNearTop);
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

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/95 shadow-sm backdrop-blur transition duration-300 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="relative flex h-20 items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          aria-label={t("app.name")}
          className="absolute left-4 top-3 z-10 flex shrink-0 items-start rounded-md sm:left-6 lg:left-8"
          href="/"
        >
          <img
            alt=""
            className="h-32 w-32 shrink-0 object-contain drop-shadow-sm bg-auto"
            src="/church-logo.png"
          />
        </Link>

        <nav
          aria-label="Primary"
          className="mx-auto grid w-full max-w-4xl auto-cols-fr grid-flow-col gap-1 overflow-x-auto px-24 sm:px-28 lg:px-0"
        >
          {menuNavItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-center text-sm font-semibold transition",
                  isActive
                    ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]",
                )}
                href={item.href}
                key={item.href}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="relative shrink-0" ref={settingsRef}>
          <button
            aria-expanded={settingsOpen}
            aria-haspopup="menu"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
            onClick={() => setSettingsOpen((open) => !open)}
            type="button"
          >
            Settings
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
                  Access
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {currentProfile.label}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {user?.email ?? "Public browsing"}
                </p>
              </div>
              <div className="grid gap-1" role="group" aria-label="Access role">
                {roleOptions.map((profile) => {
                  const isActive = profile.role === accessRole;

                  return (
                    <button
                      aria-pressed={isActive}
                      className={cn(
                        "rounded-md px-3 py-2 text-left text-sm font-semibold transition hover:bg-[var(--brand-muted)]",
                        isActive
                          ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                          : "text-[var(--text-secondary)]",
                      )}
                      key={profile.role}
                      onClick={() => switchRole(profile.role as AccessRole)}
                      type="button"
                    >
                      {profile.shortLabel}
                    </button>
                  );
                })}
              </div>
              {settingsNavItem ? (
                <Link
                  className="flex h-10 items-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                  href={settingsNavItem.href}
                  onClick={() => setSettingsOpen(false)}
                  role="menuitem"
                >
                  {t(settingsNavItem.labelKey)}
                </Link>
              ) : null}
              {isAuthenticated ? (
                <Button onClick={logout} size="sm" variant="secondary">
                  Log out
                </Button>
              ) : (
                <Button
                  onClick={() => switchRole("church-member")}
                  size="sm"
                >
                  Log in member
                </Button>
              )}
              <Button size="sm" variant="secondary">
                {t("action.newItem")}
              </Button>
              <Button size="sm">{t("action.publish")}</Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
