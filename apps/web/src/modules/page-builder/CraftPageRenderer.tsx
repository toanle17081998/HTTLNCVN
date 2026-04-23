"use client";

import { Editor, Element, Frame } from "@craftjs/core";
import { SquarePen } from "lucide-react";
import Link from "next/link";
import { ApiError } from "@services/client";
import { useResolvedPageQuery } from "@services/page";
import { Button, Card } from "@/components/ui";
import { PERMISSIONS, useAuth } from "@/providers/AuthProvider";
import { craftResolver, PageCanvas } from "./craftNodes";
import { ensureValidPageContent } from "./defaultContent";

export function CraftPageRenderer({ path }: { path: string }) {
  const pageQuery = useResolvedPageQuery(path);
  const { can } = useAuth();
  const canEdit = can(PERMISSIONS.manageArticle);

  if (pageQuery.isLoading) {
    return (
      <div className="w-full px-4 py-10 sm:px-6">
        <Card className="rounded-2xl p-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-4 h-4 w-80 max-w-full animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-8 h-[26rem] animate-pulse rounded-2xl bg-slate-100" />
        </Card>
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
          <h1 className="text-2xl font-semibold text-slate-950">Page unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
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
  const safeContent = ensureValidPageContent(page.content, page.title_en, page.route_path);

  return (
    <div className="relative w-full">
      {canEdit ? (
        <div className="fixed bottom-5 right-5 z-40">
          <Link href={`/admin/pages?route=${encodeURIComponent(path)}`}>
            <Button className="rounded-full shadow-lg">
              <SquarePen className="mr-2 h-4 w-4" />
              Edit Page
            </Button>
          </Link>
        </div>
      ) : null}

      <Editor enabled={false} resolver={craftResolver}>
        <Frame data={safeContent}>
          <Element canvas is={PageCanvas} />
        </Frame>
      </Editor>
    </div>
  );
}
