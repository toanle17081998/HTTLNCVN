"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useHomepageContentQuery } from "@services/homepage";
import { Card } from "@/components/ui";
import { HomepageContentEditorForm } from "@/modules/page/components/HomepageContentEditorForm";

export function AdminHomepage() {
  const homepageQuery = useHomepageContentQuery();

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">CMS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Homepage
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Edit the content inside fixed homepage blocks. Layout, order, and public data feeds
            stay controlled by the application.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
          href="/"
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
          Preview
        </Link>
      </section>

      <Card className="rounded-2xl border-slate-200 p-6 shadow-sm sm:p-8">
        {homepageQuery.isLoading ? (
          <div className="space-y-6">
            <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : homepageQuery.data ? (
          <HomepageContentEditorForm content={homepageQuery.data} />
        ) : (
          <p className="text-sm font-medium text-slate-600">Homepage content is unavailable.</p>
        )}
      </Card>
    </div>
  );
}
