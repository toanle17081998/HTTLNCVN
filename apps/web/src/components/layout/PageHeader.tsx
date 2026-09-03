"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useSiteNavigationQuery } from "@/services/siteNavigation";

export const defaultPageHeroImage = "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=85";

type PageHeaderProps = {
  actions?: ReactNode;
  align?: "left" | "center";
  coverImage?: string;
  description?: string;
  eyebrow?: string;
  image?: string;
  showHeroImage?: boolean;
  title: string;
};

export function PageHeader({
  actions,
  align = "left",
  coverImage,
  description,
  eyebrow,
  image,
  showHeroImage = true,
  title,
}: PageHeaderProps) {
  const pathname = usePathname();
  const { locale } = useTranslation();
  const siteNavQuery = useSiteNavigationQuery();
  const isAdmin = pathname?.startsWith("/admin");
  const isCentered = align === "center";

  // Find matching hero override (exact match or path prefix)
  const matchedRoute = pathname
    ? Object.keys(siteNavQuery.data?.pageHeroes ?? {}).find(
        (route) => pathname === route || (route !== "/" && pathname.startsWith(route))
      )
    : undefined;
  const heroOverride = matchedRoute ? siteNavQuery.data?.pageHeroes?.[matchedRoute] : undefined;

  const resolvedEyebrow =
    (locale === "vi" ? heroOverride?.eyebrowVi : heroOverride?.eyebrowEn) ||
    eyebrow;
  const resolvedTitle =
    (locale === "vi" ? heroOverride?.titleVi : heroOverride?.titleEn) ||
    title;
  const resolvedDescription =
    (locale === "vi" ? heroOverride?.descriptionVi : heroOverride?.descriptionEn) ||
    description;
  const heroImageSrc = heroOverride?.coverImage || coverImage || image || defaultPageHeroImage;

  if (isAdmin) {
    return (
      <div className="flex min-w-0 flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 pt-1 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 max-w-3xl">
          {resolvedEyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-gold)]">
              {resolvedEyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 break-words text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-3xl">
            {resolvedTitle}
          </h1>
          {resolvedDescription ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              {resolvedDescription}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div> : null}
      </div>
    );
  }

  return (
    <section
      className="page-builder-section relative w-full"
      style={{
        padding: "var(--section-space-md) 0 var(--section-space-lg)",
      }}
    >
      <div
        className={cn(
          "grid items-start gap-8 lg:gap-12",
          isCentered || !showHeroImage ? "max-w-3xl mx-auto text-center" : "lg:grid-cols-2",
        )}
      >
        {/* Left Column: Eyebrow, Title, Description, Button Stack (Top to Bottom) */}
        <div
          className={cn(
            "flex flex-col justify-start",
            isCentered ? "items-center text-center" : "items-start text-left",
          )}
          style={{
            gap: "var(--section-space-md)",
          }}
        >
          {resolvedEyebrow ? (
            <p
              style={{
                color: "var(--accent-gold)",
                fontSize: "var(--section-kicker-size, 0.75rem)",
                fontWeight: "var(--section-weight-bold)",
                letterSpacing: "0.2em",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              {resolvedEyebrow}
            </p>
          ) : null}

          <h1
            style={{
              color: "var(--brand-primary)",
              fontFamily: "var(--font-lora), Georgia, serif",
              fontSize: "var(--section-title-size)",
              fontWeight: "var(--section-weight-bold)",
              letterSpacing: "-0.025em",
              lineHeight: "var(--section-title-line-height)",
              margin: 0,
            }}
          >
            {resolvedTitle}
          </h1>

          {resolvedDescription ? (
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--section-body-size)",
                lineHeight: "var(--section-body-line-height)",
                margin: 0,
                maxWidth: "38rem",
              }}
            >
              {resolvedDescription}
            </p>
          ) : null}

          {actions ? (
            <div
              className={cn(
                "flex flex-wrap items-center pt-2",
                isCentered ? "justify-center" : "justify-start",
              )}
              style={{ gap: "var(--section-space-sm)" }}
            >
              {actions}
            </div>
          ) : null}
        </div>

        {/* Right Column: 1 Single Featured Hero Image */}
        {!isCentered && showHeroImage ? (
          <div
            className="group relative w-full overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card-strong)] shadow-md transition-shadow duration-500 hover:shadow-xl"
            style={{
              borderRadius: "var(--section-radius-card)",
              height: "clamp(18rem, 30vw, 25rem)",
              minHeight: "18rem",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              src={heroImageSrc}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
