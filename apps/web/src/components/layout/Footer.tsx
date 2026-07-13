"use client";

import Link from "next/link";
import {
  CalendarDays,
  Mail,
  MapPin,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/providers/I18nProvider";
import { ChurchLogo } from "./ChurchLogo";

type ContactItem = {
  icon: LucideIcon;
  labelKey: string;
  valueKey: string;
  href?: string;
};

const contactItems: ContactItem[] = [
  {
    icon: Mail,
    labelKey: "footer.contact.general",
    valueKey: "hello@httlncvn.local",
    href: "mailto:hello@httlncvn.local",
  },
  {
    icon: CalendarDays,
    labelKey: "footer.contact.events",
    valueKey: "events@httlncvn.local",
    href: "mailto:events@httlncvn.local",
  },
  {
    icon: MapPin,
    labelKey: "footer.contact.visit",
    valueKey: "footer.contact.visitValue",
  },
  {
    icon: MessageCircle,
    labelKey: "footer.contact.community",
    valueKey: "footer.contact.communityValue",
  },
];

const footerLinks = [
  { href: "/about", labelKey: "nav.about.label" },
  { href: "/article", labelKey: "nav.article.label" },
  { href: "/event", labelKey: "nav.event.label" },
  { href: "/auth", labelKey: "nav.auth.label" },
] as const;

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[var(--bg-card)] px-4 py-12 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, var(--brand-muted) 0%, transparent 34%), linear-gradient(180deg, color-mix(in srgb, var(--bg-surface) 84%, transparent) 0%, var(--bg-card) 100%)",
        }}
      />

      <div className="relative grid w-full gap-8">
        <div className="grid gap-8 pb-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center">
                <ChurchLogo className="h-11 w-11" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
                  {t("footer.contact.community")}
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {t("app.name")}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("app.tagline")}
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              {t("footer.description")}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              <span className="h-px w-8 bg-[var(--accent-gold)]" />
              {t("footer.rights")}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {contactItems.map((item) => {
              const Icon = item.icon;
              const label = t(item.labelKey as any);
              const value = item.valueKey.includes(".") ? t(item.valueKey as any) : item.valueKey;

              const content = (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--brand-primary)] transition group-hover:text-[var(--accent-gold)]">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">
                      {label}
                    </span>
                    <span className="mt-0.5 block text-sm leading-5 text-[var(--text-secondary)]">
                      {value}
                    </span>
                  </span>
                </>
              );

              return item.href ? (
                <a
                  className="group flex min-h-20 items-center gap-4 px-1 py-3 transition-colors hover:text-[var(--brand-primary)]"
                  href={item.href}
                  key={item.labelKey}
                >
                  {content}
                </a>
              ) : (
                <div
                  className="group flex min-h-20 items-center gap-4 px-1 py-3"
                  key={item.labelKey}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="text-sm text-[var(--text-secondary)]">
            {"\u00A9"} HTNC {currentYear}. {t("footer.rights")}
          </p>

          <nav aria-label="Footer" className="flex flex-wrap gap-2">
            {footerLinks.map((item) => (
              <Link
                className="rounded-sm px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
                href={item.href}
                key={item.href}
              >
                {t(item.labelKey as any)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

