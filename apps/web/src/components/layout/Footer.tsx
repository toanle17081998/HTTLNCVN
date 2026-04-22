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

type ContactItem = {
  icon: LucideIcon;
  labelKey: any;
  valueKey: any;
  href?: string;
};

const contactItems: ContactItem[] = [
  {
    icon: Mail,
    labelKey: "footer.contact.general",
    valueKey: "hello@httlncvn.local", // Assuming this is fixed
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
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {contactItems.map((item) => {
              const Icon = item.icon;
              const label = t(item.labelKey);
              const value = item.valueKey.includes(".") ? t(item.valueKey) : item.valueKey;
              
              const content = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span>
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
                  className="flex items-center gap-3 rounded-md border border-[var(--border-subtle)] p-3 transition hover:border-[var(--brand-primary)] hover:bg-[var(--brand-muted)]"
                  href={item.href}
                  key={item.labelKey}
                >
                  {content}
                </a>
              ) : (
                <div
                  className="flex items-center gap-3 rounded-md border border-[var(--border-subtle)] p-3"
                  key={item.labelKey}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-5">
          <p className="text-sm text-[var(--text-secondary)]">
            © HTTLNC 2026. {t("footer.rights")}
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-2">
            {footerLinks.map((item) => (
              <Link
                className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
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
