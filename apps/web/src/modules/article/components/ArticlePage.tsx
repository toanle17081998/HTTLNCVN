"use client";

import Link from "next/link";
import { PageLayout } from "@/components/layout";
import { Card } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";

type ArticleVisibility = "public" | "internal";

type ArticlePreview = {
  id: string;
  title: string;
  excerpt: string;
  visibility: ArticleVisibility;
};

const articlePreviews: ArticlePreview[] = [
  {
    id: "public-welcome",
    title: "Welcome to the HTNC learning hub",
    excerpt: "A public overview of new lectures, events, and community updates.",
    visibility: "public",
  },
  {
    id: "public-event-recap",
    title: "Community night recap",
    excerpt: "Photos and highlights from a recent public gathering.",
    visibility: "public",
  },
  {
    id: "internal-care-team",
    title: "Care team weekly notes",
    excerpt: "Internal updates for members and care volunteers.",
    visibility: "internal",
  },
  {
    id: "internal-course-planning",
    title: "Spring course planning",
    excerpt: "Member-facing learning path notes and recommendations.",
    visibility: "internal",
  },
];

export function ArticlePage() {
  const { can } = useAuth();
  const { t } = useTranslation();
  const canManageArticle = can(PERMISSIONS.manageArticle);
  const canViewInternal = can(PERMISSIONS.viewInternalArticle);
  const visibleArticles = articlePreviews.filter(
    (article) => article.visibility === "public" || canViewInternal,
  );

  return (
    <PageLayout
      actions={
        canManageArticle ? (
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-transparent bg-[var(--btn-primary-bg)] px-4 text-sm font-semibold text-[var(--btn-primary-text)] shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
            href="/create-article"
          >
            {t("action.createArticle")}
          </Link>
        ) : null
      }
      description={t("page.article.description")}
      eyebrow={t("page.article.eyebrow")}
      title={t("page.article.title")}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {visibleArticles.map((article) => (
          <Card className="p-6" key={article.id}>
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-xs font-semibold uppercase text-[var(--brand-primary)]">
                {article.visibility}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
              {article.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {article.excerpt}
            </p>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
