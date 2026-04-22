"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Card } from "@/components/ui";
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
import { ArticleMetadataPanel } from "./ArticleMetadataPanel";

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

export function CreateArticlePage() {
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("slug") ?? undefined;
  const articleQuery = useArticleQuery(editSlug);

  if (editSlug && articleQuery.isLoading) {
    return (
      <PageLayout description="Loading article content." eyebrow="Article" title="Edit article">
        <Card className="p-4 text-sm text-[var(--text-secondary)]">Loading article...</Card>
      </PageLayout>
    );
  }

  if (editSlug && articleQuery.error) {
    return (
      <PageLayout description="The article could not be loaded." eyebrow="Article" title="Edit article">
        <Card className="p-4 text-sm font-medium text-[var(--status-danger)]">
          {articleQuery.error instanceof Error ? articleQuery.error.message : "Could not load article."}
        </Card>
      </PageLayout>
    );
  }

  return (
    <ArticleEditorPage
      key={editSlug ?? "create"}
      editSlug={editSlug}
      initialArticle={articleQuery.data ?? null}
    />
  );
}

type ArticleEditorPageProps = {
  editSlug?: string;
  initialArticle: Article | null;
};

function ArticleEditorPage({ editSlug, initialArticle }: ArticleEditorPageProps) {
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
      setSubmitState({ status: "error", message: "Title is required." });
      return;
    }

    if (!nextContent.trim()) {
      setSubmitState({ status: "error", message: "Content is required." });
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
        message: `${editSlug ? "Updated" : "Created"} article ${article.slug}.`,
      });
      router.push("/article");
      router.refresh();
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Article submit failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout
      description={editSlug ? "Update article content and publishing status." : t("article.create.description")}
      eyebrow={t("page.article.eyebrow")}
      title={editSlug ? "Edit article" : t("article.create.title")}
    >
      <form className="grid gap-8 lg:grid-cols-[20rem_1fr] lg:items-start" onSubmit={handleSubmit}>
        <ArticleMetadataPanel
          categoryId={categoryId}
          coverImageUrl={coverImageUrl}
          isSubmitting={isSubmitting}
          status={status}
          submitState={submitState}
          title={title}
          onCategoryIdChange={setCategoryId}
          onCoverImageUrlChange={setCoverImageUrl}
          onStatusChange={setStatus}
          onTitleChange={setTitle}
        />

        <ModularEditor
          label={t("article.create.editor")}
          initialValue={initialBody}
          onChange={() => {}} // We use ref for submission
          ref={editorRef}
          placeholder="Write your article content here..."
          className="lg:max-h-[calc(100vh-9rem)]"
        />
      </form>
    </PageLayout>
  );
}
