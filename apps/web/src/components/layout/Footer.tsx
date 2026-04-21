import Link from "next/link";
import {
  CalendarDays,
  Mail,
  MapPin,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

type ContactItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
};

const contactItems: ContactItem[] = [
  {
    icon: Mail,
    label: "General",
    value: "hello@httlncvn.local",
    href: "mailto:hello@httlncvn.local",
  },
  {
    icon: CalendarDays,
    label: "Events",
    value: "events@httlncvn.local",
    href: "mailto:events@httlncvn.local",
  },
  {
    icon: MapPin,
    label: "Visit",
    value: "Sunday support desk after service",
  },
  {
    icon: MessageCircle,
    label: "Community",
    value: "Telegram updates and prayer support",
  },
];

const footerLinks = [
  { href: "/about", label: "About Us" },
  { href: "/article", label: "Article" },
  { href: "/event", label: "Events" },
  { href: "/auth", label: "Access" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="flex items-center gap-3">
              <img
                alt=""
                className="h-12 w-12 object-contain"
                src="/church-logo.png"
              />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">
                  HTNC Platform
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Learning and community
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              Public learning, community updates, member tools, and ministry
              workflows in one shared space.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {contactItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-sm leading-5 text-[var(--text-secondary)]">
                      {item.value}
                    </span>
                  </span>
                </>
              );

              return item.href ? (
                <a
                  className="flex items-center gap-3 rounded-md border border-[var(--border-subtle)] p-3 transition hover:border-[var(--brand-primary)] hover:bg-[var(--brand-muted)]"
                  href={item.href}
                  key={item.label}
                >
                  {content}
                </a>
              ) : (
                <div
                  className="flex items-center gap-3 rounded-md border border-[var(--border-subtle)] p-3"
                  key={item.label}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-5">
          <p className="text-sm text-[var(--text-secondary)]">
            Â© 2026 HTNC. All rights reserved.
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-2">
            {footerLinks.map((item) => (
              <Link
                className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
