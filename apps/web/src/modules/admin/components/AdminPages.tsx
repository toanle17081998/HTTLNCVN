"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Eye, Save, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@services/client";
import {
  type Article,
  useArticleQuery,
  useUpdateArticleMutation,
  type UpdateArticleDto,
} from "@services/article";
import { pageKeys } from "@services/page";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";

const editablePages = [
  { slug: "home", label: "Homepage", publicPath: "/" },
  { slug: "about", label: "About Us", publicPath: "/about" },
  { slug: "contact", label: "Contact", publicPath: "/contact" },
  { slug: "terms", label: "Terms", publicPath: "/terms" },
  { slug: "privacy", label: "Privacy", publicPath: "/privacy" },
];

type PageFormState = {
  title_en: string;
  title_vi: string;
  cover_image_url: string;
  content_markdown_en: string;
  content_markdown_vi: string;
  status: "draft" | "published";
};

export function AdminPages() {
  const [selectedSlug, setSelectedSlug] = useState(editablePages[0].slug);
  const selectedPage = useMemo(
    () => editablePages.find((page) => page.slug === selectedSlug) ?? editablePages[0],
    [selectedSlug],
  );
  const pageQuery = useArticleQuery(selectedSlug);

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">CMS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Pages
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Update reserved website pages from one place. Page content is stored in the
            existing article system using fixed slugs.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
          href={selectedPage.publicPath}
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
          Preview
        </Link>
      </section>

      <section className="grid gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <Card className="overflow-hidden rounded-2xl border-slate-200 p-2 shadow-sm">
            <nav aria-label="Pages" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {editablePages.map((page) => {
                const isActive = selectedSlug === page.slug;
                return (
                  <button
                    className={`shrink-0 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                    }`}
                    key={page.slug}
                    onClick={() => setSelectedSlug(page.slug)}
                    type="button"
                  >
                    {page.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </aside>

        <main className="lg:col-span-9">
          <Card className="rounded-2xl border-slate-200 p-6 shadow-sm sm:p-8">
            {pageQuery.isLoading ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                </div>
                <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ) : pageQuery.isError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-amber-900">
                  This reserved page does not have a matching article yet. Create an article
                  with slug <span className="font-bold underline">{selectedSlug}</span> to manage it here.
                </p>
              </div>
            ) : pageQuery.data ? (
              <div className="animate-in fade-in duration-500">
                <PageEditor article={pageQuery.data} key={pageQuery.data.id} slug={selectedSlug} />
              </div>
            ) : null}
          </Card>
        </main>
      </section>
    </div>
  );
}

function PageEditor({ article, slug }: { article: Article; slug: string }) {
  const queryClient = useQueryClient();
  const updatePage = useUpdateArticleMutation(slug);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<PageFormState>(() => ({
    title_en: article.title_en,
    title_vi: article.title_vi,
    cover_image_url: article.cover_image_url ?? "",
    content_markdown_en: article.content_markdown_en,
    content_markdown_vi: article.content_markdown_vi,
    status: article.status === "published" ? "published" : "draft",
  }));

  function updateField<K extends keyof PageFormState>(field: K, value: PageFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const payload: UpdateArticleDto = {
      title_en: form.title_en,
      title_vi: form.title_vi,
      content_markdown_en: form.content_markdown_en,
      content_markdown_vi: form.content_markdown_vi,
      cover_image_url: form.cover_image_url || undefined,
      status: form.status,
    };

    try {
      await updatePage.mutateAsync(payload);
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(slug) });
      setMessage("Page content saved.");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Could not save page content.");
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          English title
          <Input
            onChange={(event) => updateField("title_en", event.target.value)}
            value={form.title_en}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Vietnamese title
          <Input
            onChange={(event) => updateField("title_vi", event.target.value)}
            value={form.title_vi}
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_12rem]">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Cover image URL
          <Input
            onChange={(event) => updateField("cover_image_url", event.target.value)}
            value={form.cover_image_url}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Status
          <Select
            onChange={(event) =>
              updateField("status", event.target.value as PageFormState["status"])
            }
            value={form.status}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        English content
        <Textarea
          className="min-h-56 font-mono"
          onChange={(event) => updateField("content_markdown_en", event.target.value)}
          value={form.content_markdown_en}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Vietnamese content
        <Textarea
          className="min-h-56 font-mono"
          onChange={(event) => updateField("content_markdown_vi", event.target.value)}
          value={form.content_markdown_vi}
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <p className="text-sm text-slate-600">{message ?? `Editing /${slug}`}</p>
        <Button isLoading={updatePage.isPending} type="submit">
          <Save aria-hidden="true" className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}
