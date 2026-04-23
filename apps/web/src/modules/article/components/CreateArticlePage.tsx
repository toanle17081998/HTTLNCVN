"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Button, Card, FormField, Input, Select } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import {
  articleApi,
  useArticleQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  type Article,
  type ArticleStatus,
  type CreateArticleDto,
} from "@services/article";
import { type SubmitState } from "./articleEditorTypes";
import { ModularEditor, type ModularEditorHandle } from "./ModularEditor";

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[đĐ]/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "") || `article-${Date.now()}`
  );
}

type CreateArticlePageProps = {
  afterSaveHref?: string;
};

export function CreateArticlePage({ afterSaveHref = "/article" }: CreateArticlePageProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("slug") ?? undefined;
  const articleQuery = useArticleQuery(editSlug);

  if (editSlug && articleQuery.isLoading) {
    return (
      <PageLayout description={t("article.edit.loadingDescription")} eyebrow={t("page.article.eyebrow")} title={t("article.edit.title")}>
        <Card className="p-4 text-sm text-[var(--text-secondary)]">{t("article.edit.loading")}</Card>
      </PageLayout>
    );
  }

  if (editSlug && articleQuery.error) {
    return (
      <PageLayout description={t("article.edit.errorDescription")} eyebrow={t("page.article.eyebrow")} title={t("article.edit.title")}>
        <Card className="p-4 text-sm font-medium text-[var(--status-danger)]">
          {articleQuery.error instanceof Error ? articleQuery.error.message : t("article.edit.error")}
        </Card>
      </PageLayout>
    );
  }

  return (
    <ArticleEditorPage
      key={editSlug ?? "create"}
      afterSaveHref={afterSaveHref}
      editSlug={editSlug}
      initialArticle={articleQuery.data ?? null}
    />
  );
}

type ArticleEditorPageProps = {
  afterSaveHref: string;
  editSlug?: string;
  initialArticle: Article | null;
};

function ArticleEditorPage({ afterSaveHref, editSlug, initialArticle }: ArticleEditorPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const editorRef = useRef<ModularEditorHandle>(null);
  const createArticle = useCreateArticleMutation();
  const updateArticle = useUpdateArticleMutation(editSlug ?? "");

  const initialBody = initialArticle?.content_markdown_vi || initialArticle?.content_markdown_en || "";

  const [title, setTitle] = useState(initialArticle?.title_vi || initialArticle?.title_en || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialArticle?.cover_image_url ?? "");
  const [categoryId, setCategoryId] = useState(initialArticle?.category?.id ? String(initialArticle.category.id) : "");
  const [status, setStatus] = useState<ArticleStatus>(initialArticle?.status === "published" ? "published" : "draft");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitState({ status: "idle", message: "" });

    const nextContent = editorRef.current?.getCleanedValue() || "";

    if (!title.trim()) {
      setSubmitState({ status: "error", message: t("article.create.titleRequired") });
      return;
    }

    if (!nextContent.trim()) {
      setSubmitState({ status: "error", message: t("article.create.contentRequired") });
      return;
    }

    setIsSubmitting(true);

    const nextSlug = editSlug ?? slugify(title);
    const payload: CreateArticleDto = {
      content_markdown_en: nextContent,
      content_markdown_vi: nextContent,
      ...(categoryId ? { category_id: Number(categoryId) } : {}),
      cover_image_url: coverImageUrl.trim() || undefined,
      slug: nextSlug,
      title_en: title.trim(),
      title_vi: title.trim(),
    };

    try {
      let article = editSlug
        ? await updateArticle.mutateAsync({ ...payload, status })
        : await createArticle.mutateAsync(payload);

      if (!editSlug && status === "published") {
        article = await articleApi.update(article.slug, { status });
      }

      setSubmitState({
        status: "success",
        message: t(editSlug ? "article.edit.updated" : "article.create.created", { slug: article.slug }),
      });
      router.push(afterSaveHref);
      router.refresh();
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : t("article.create.submitFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout
      description={editSlug ? t("article.edit.description") : t("article.create.description")}
      eyebrow={t("page.article.eyebrow")}
      title={editSlug ? t("article.edit.title") : t("article.create.title")}
    >
      <Card className="mx-auto w-full min-w-0 max-w-5xl overflow-hidden border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm sm:p-6 lg:p-8">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <FormField htmlFor="article-title" label={t("form.title")}>
            <Input
              id="article-title"
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("article.create.titlePlaceholder")}
              required
              value={title}
            />
          </FormField>

          <div className="grid min-w-0 gap-6 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4 md:grid-cols-3">
            <FormField htmlFor="article-cover-image-url" label={t("course.form.coverImage")}>
              <Input
                id="article-cover-image-url"
                onChange={(event) => setCoverImageUrl(event.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
                value={coverImageUrl}
              />
            </FormField>

            <FormField htmlFor="article-category" label={t("prayer.form.category")}>
              <Select
                id="article-category"
                onChange={(event) => setCategoryId(event.target.value)}
                value={categoryId}
              >
                <option value="">{t("prayer.form.categoryNone")}</option>
                <option value="1">{t("article.category.news")}</option>
                <option value="2">{t("article.category.teaching")}</option>
                <option value="3">{t("article.category.devotional")}</option>
              </Select>
            </FormField>

            <FormField htmlFor="article-status" label={t("course.form.status")}>
              <Select
                id="article-status"
                onChange={(event) => setStatus(event.target.value === "published" ? "published" : "draft")}
                value={status}
              >
                <option value="draft">{t("course.form.status.draft")}</option>
                <option value="published">{t("course.form.status.published")}</option>
              </Select>
            </FormField>
          </div>

          <ModularEditor
            label={t("article.create.editor")}
            initialValue={initialBody}
            onChange={() => {}} // We use ref for submission
            ref={editorRef}
            placeholder={t("article.create.editorPlaceholder")}
            className="min-w-0 max-w-full"
          />

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-6">
            {submitState.message ? (
              <p
                className={
                  submitState.status === "success"
                    ? "text-sm font-medium text-[var(--status-success)]"
                    : "text-sm font-medium text-[var(--status-danger)]"
                }
              >
                {submitState.message}
              </p>
            ) : (
              <span />
            )}

            <div className="flex justify-end gap-4">
              <Button
                disabled={isSubmitting}
                onClick={() => window.history.back()}
                type="button"
                variant="ghost"
              >
                {t("common.cancel")}
              </Button>
              <Button isLoading={isSubmitting} type="submit">
                {isSubmitting ? t("article.create.submitting") : t("action.submit")}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
}
