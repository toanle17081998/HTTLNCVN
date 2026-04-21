import Link from "next/link";
import { navItems } from "./navigation";

type BreadcrumbProps = {
  pathname: string;
};

function toTitle(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Breadcrumb({ pathname }: BreadcrumbProps) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="text-sm">
        <span className="font-medium text-[var(--text-primary)]">
          Dashboard
        </span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-[var(--text-secondary)]">
        <li>
          <Link className="hover:text-[var(--brand-primary)]" href="/">
            Dashboard
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const navLabel = navItems.find((item) => item.href === href)?.label;
          const isLast = index === segments.length - 1;

          return (
            <li className="flex items-center gap-2" key={href}>
              <span aria-hidden="true" className="text-[var(--text-tertiary)]">
                /
              </span>
              {isLast ? (
                <span className="font-medium text-[var(--text-primary)]">
                  {navLabel ?? toTitle(segment)}
                </span>
              ) : (
                <Link
                  className="hover:text-[var(--brand-primary)]"
                  href={href}
                >
                  {navLabel ?? toTitle(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
