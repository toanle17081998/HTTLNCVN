import Link from "next/link";
import { cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { navItems } from "./navigation";

type SidebarProps = {
  pathname: string;
};

export function Sidebar({ pathname }: SidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:block">
      <div className="sticky top-0 flex h-screen flex-col gap-6 px-4 py-5">
        <Link className="rounded-md px-2 py-1" href="/">
          <span className="block text-lg font-semibold text-[var(--text-primary)]">
            {t("app.name")}
          </span>
          <span className="block text-sm text-[var(--text-secondary)]">
            {t("app.tagline")}
          </span>
        </Link>

        <nav aria-label="Primary" className="grid gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition",
                  isActive
                    ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]",
                )}
                href={item.href}
                key={item.href}
              >
                <span className="block font-semibold">{t(item.labelKey)}</span>
                <span className="mt-0.5 block text-xs opacity-80">
                  {t(item.descriptionKey)}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
