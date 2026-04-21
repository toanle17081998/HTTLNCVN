"use client";

import Link from "next/link";
import { RoutePlaceholder } from "@/components/RoutePlaceholder";
import { useTranslation } from "@/providers/I18nProvider";

export function BlogPage() {
  const { t } = useTranslation();

  return (
    <RoutePlaceholder
      actions={
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-transparent bg-[var(--btn-primary-bg)] px-4 text-sm font-semibold text-[var(--btn-primary-text)] shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
          href="/create-blog"
        >
          {t("action.createBlog")}
        </Link>
      }
      descriptionKey="page.blog.description"
      eyebrowKey="page.blog.eyebrow"
      titleKey="page.blog.title"
    />
  );
}
