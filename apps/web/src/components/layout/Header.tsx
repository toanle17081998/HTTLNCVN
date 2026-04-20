import Link from "next/link";
import { Button } from "@/components/ui";
import { Breadcrumb } from "./Breadcrumb";
import { getActiveNavItem, navItems } from "./navigation";

type HeaderProps = {
  pathname: string;
};

export function Header({ pathname }: HeaderProps) {
  const activeItem = getActiveNavItem(pathname);

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <Breadcrumb pathname={pathname} />
          <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
            {activeItem.description}
          </p>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button size="sm" variant="secondary">
            New item
          </Button>
          <Button size="sm">Publish</Button>
        </div>
      </div>

      <nav
        aria-label="Primary mobile"
        className="flex gap-2 overflow-x-auto border-t border-[var(--border-subtle)] px-4 py-2 lg:hidden"
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "shrink-0 rounded-md bg-[var(--brand-muted)] px-3 py-2 text-sm font-semibold text-[var(--brand-primary)]"
                  : "shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--brand-muted)]"
              }
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
