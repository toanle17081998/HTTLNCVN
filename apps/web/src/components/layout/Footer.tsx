"use client";

import Link from "next/link";
import { useTranslation } from "@/providers/I18nProvider";
import { ChurchLogo } from "./ChurchLogo";
import { useSiteNavigationQuery, defaultSiteNavigationConfig } from "@/services/siteNavigation";
import { resolveIcon } from "@/components/page-builder/shared/iconList";

export function Footer() {
  const { t, locale } = useTranslation();
  const currentYear = new Date().getFullYear();

  const siteNavQuery = useSiteNavigationQuery();
  const siteNav = siteNavQuery.data ?? defaultSiteNavigationConfig;
  const footerData = siteNav.footer;

  const communityTitle = footerData.communityTitle || t("footer.contact.community");
  const appName = footerData.appName || t("app.name");
  const tagline = footerData.tagline || t("app.tagline");
  const description =
    locale === "vi"
      ? footerData.descriptionVi || footerData.descriptionEn || t("footer.description")
      : footerData.descriptionEn || footerData.descriptionVi || t("footer.description");
  const copyrightText =
    locale === "vi"
      ? footerData.copyrightTextVi || footerData.copyrightTextEn || t("footer.rights")
      : footerData.copyrightTextEn || footerData.copyrightTextVi || t("footer.rights");

  const contacts = footerData.contacts ?? defaultSiteNavigationConfig.footer.contacts;
  const links = footerData.links ?? defaultSiteNavigationConfig.footer.links;

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

      <div className="relative mx-auto grid w-full max-w-7xl gap-8">
        <div className="grid gap-8 pb-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center">
                <ChurchLogo className="h-11 w-11" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-gold)] hover:text-[var(--brand-primary)]">
                  {communityTitle}
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {appName}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {tagline}
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              {description}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              <span className="h-px w-8 bg-[var(--accent-gold)]" />
              {copyrightText}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((item) => {
              const IconComp = resolveIcon(item.icon);
              const label = locale === "vi" ? item.labelVi || item.labelEn : item.labelEn || item.labelVi;
              const value = locale === "vi" ? item.valueVi || item.valueEn : item.valueEn || item.valueVi;

              const content = (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--accent-gold)] transition">
                    <IconComp aria-hidden="true" className="h-5 w-5" />
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
                  key={item.id || item.labelEn}
                >
                  {content}
                </a>
              ) : (
                <div
                  className="group flex min-h-20 items-center gap-4 px-1 py-3"
                  key={item.id || item.labelEn}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="text-sm text-[var(--text-secondary)]">
            {"\u00A9"} {appName} {currentYear}. {copyrightText}
          </p>

          <nav aria-label="Footer" className="flex flex-wrap gap-2">
            {links.map((item) => {
              const label = locale === "vi" ? item.labelVi || item.labelEn : item.labelEn || item.labelVi;
              return (
                <Link
                  className="rounded-sm px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
                  href={item.href}
                  key={item.id || item.href}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </footer>
  );
}

