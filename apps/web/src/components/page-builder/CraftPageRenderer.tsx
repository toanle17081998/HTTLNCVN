"use client";

import { Editor, Element, Frame } from "@craftjs/core";
import { SquarePen } from "lucide-react";
import Link from "next/link";
import { ApiError } from "@/services/client";
import { useResolvedPageQuery } from "@/services/page";
import { Button, Card } from "@/components/ui";
import { PERMISSIONS, useAuth } from "@/providers/AuthProvider";
import { craftResolver, PageCanvas } from "./craftNodes";
import { ensureValidPageContent } from "./defaultContent";
import { useTranslation } from "@/providers/I18nProvider";

export function CraftPageRenderer({
  path,
  previewLanguage,
}: {
  path: string;
  previewLanguage?: "en" | "vi";
}) {
  const pageQuery = useResolvedPageQuery(path);
  const { can } = useAuth();
  const { locale } = useTranslation();
  const canEdit = can(PERMISSIONS.manageArticle);
  const readerLang = previewLanguage ?? (locale === "vi" ? "vi" : "en");

  if (pageQuery.isLoading) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center bg-[var(--bg-base)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand-primary)] border-t-transparent" />
      </div>
    );
  }

  if (pageQuery.isError) {
    const message =
      pageQuery.error instanceof ApiError && pageQuery.error.status === 404
        ? "This route is not mapped to a published page yet."
        : "This page could not be loaded.";

    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <Card className="rounded-2xl p-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Page unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{message}</p>
          {canEdit ? (
            <div className="mt-6">
              <Link href={`/admin/pages?route=${encodeURIComponent(path)}`}>
                <Button>
                  <SquarePen className="mr-2 h-4 w-4" />
                  Open page builder
                </Button>
              </Link>
            </div>
          ) : null}
        </Card>
      </div>
    );
  }

  const page = pageQuery.data;
  if (!page) return null;

  const rawActive = readerLang === "vi" ? page.content_vi : page.content_en;
  // If the active language content is empty or default template, use the non-empty content
  const activeContent = rawActive && rawActive.trim() && rawActive !== "{}" ? rawActive : (page.content_en || page.content_vi);
  const validContent = ensureValidPageContent(
    activeContent,
    readerLang === "vi" ? page.title_vi || page.title_en : page.title_en || page.title_vi,
    page.route_path
  );

  return (
    <div className="published-page-builder relative w-full">
      {canEdit ? (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3 items-end">
          <Link href={`/admin/pages?route=${encodeURIComponent(path)}`}>
            <Button className="rounded-full shadow-lg">
              <SquarePen className="mr-2 h-4 w-4" />
              Edit Page
            </Button>
          </Link>
        </div>
      ) : null}

      <Editor key={`${readerLang}-${page.updated_at}`} enabled={false} resolver={craftResolver}>
        <Frame data={validContent}>
          <Element canvas is={PageCanvas} snapType="none" />
        </Frame>
      </Editor>
    </div>
  );
}
