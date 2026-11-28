"use client";

import { Editor, Element, Frame } from "@craftjs/core";
import { SquarePen } from "lucide-react";
import Link from "next/link";
import { ApiError } from "@/api/client";
import { useResolvedPageQuery, type Page } from "@/hooks/page";
import { Button, ButtonLink, Card, Title, Text } from "@/components/ui";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PERMISSIONS, useAuth } from "@/providers/AuthProvider";
import { craftResolver, PageCanvas } from "./craftNodes";
import { ensureValidPageContent } from "./defaultContent";
import { useTranslation } from "@/providers/I18nProvider";
import { getLocalizedField, type Locale } from "@/lib/i18n";
import { PageBuilderSkeleton, rememberPageSkeletonVariants } from "./PageBuilderSkeleton";
import { useEffect } from "react";

export function CraftPageRenderer({
  initialPage,
  path,
  previewLanguage,
}: {
  initialPage?: Page | null;
  path: string;
  previewLanguage?: Locale;
}) {
  const pageQuery = useResolvedPageQuery(path, initialPage);
  const { can } = useAuth();
  const { locale } = useTranslation();
  const canEdit = can(PERMISSIONS.manageArticle);
  const readerLang = previewLanguage ?? locale;

  useEffect(() => {
    if (path !== "/") return;
    const root = document.documentElement;
    if (!pageQuery.isLoading) {
      root.dataset.landingPageReady = "true";
      window.dispatchEvent(new Event("httlncvn:landing-page-ready"));
    } else {
      delete root.dataset.landingPageReady;
    }

    return () => {
      delete root.dataset.landingPageReady;
    };
  }, [pageQuery.isLoading, path]);

  const page = pageQuery.data;
  const rawActive = page ? getLocalizedField(page, "content", readerLang) : "";
  // If the active language content is empty or default template, use the non-empty content
  const activeContent = page
    ? rawActive && rawActive.trim() && rawActive !== "{}"
      ? rawActive
      : getLocalizedField(page, "content")
    : "";
  const validContent = page
    ? ensureValidPageContent(
        activeContent,
        getLocalizedField(page, "title", readerLang),
        page.route_path,
      )
    : "";

  useEffect(() => {
    if (!validContent) return;
    rememberPageSkeletonVariants(path, validContent);
  }, [path, validContent]);

  if (pageQuery.isLoading) {
    if (path === "/") return null;
    return <PageBuilderSkeleton path={path} />;
  }

  if (pageQuery.isError) {
    const message =
      pageQuery.error instanceof ApiError && pageQuery.error.status === 404
        ? "This route is not mapped to a published page yet."
        : "This page could not be loaded.";

    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <Card className="rounded-2xl p-8">
          <Title as="h1" variant="modal">Page unavailable</Title>
          <Text as="p" tone="inherit" variant="inherit" className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{message}</Text>
          {canEdit ? (
            <div className="mt-6">
              <Link href={`/admin/pages?route=${encodeURIComponent(path)}`}>
                <Button variant="primary">
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

  if (!page) return null;

  return (
    <div className="published-page-builder relative w-full">
      {canEdit ? (
        <div className="fixed bottom-6 right-20 z-40 hidden lg:block">
          <ButtonLink
            className="rounded-full shadow-lg"
            href={`/admin/pages?route=${encodeURIComponent(path)}`}
            variant="primary"
          >
            <SquarePen className="mr-2 h-4 w-4" />
            Edit Page
          </ButtonLink>
        </div>
      ) : null}

      <ErrorBoundary resetKey={`${path}-${readerLang}-${page.updated_at}`}>
        <Editor key={`${readerLang}-${page.updated_at}`} enabled={false} resolver={craftResolver}>
          <Frame data={validContent}>
            <Element canvas is={PageCanvas} snapType="none" />
          </Frame>
        </Editor>
      </ErrorBoundary>
    </div>
  );
}
