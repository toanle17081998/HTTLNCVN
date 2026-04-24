"use client";

import { Button, Card, FormField, Input, Select } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { SubmitState } from "./articleEditorTypes";

type ArticleMetadataPanelProps = {
  title: string;
  coverImageUrl: string;
  categoryId: string;
  status: "draft" | "published";
  isSubmitting: boolean;
  submitState: SubmitState;
  onTitleChange: (v: string) => void;
  onCoverImageUrlChange: (v: string) => void;
  onCategoryIdChange: (v: string) => void;
  onStatusChange: (v: "draft" | "published") => void;
};

export function ArticleMetadataPanel({
  title,
  coverImageUrl,
  categoryId,
  status,
  isSubmitting,
  submitState,
  onTitleChange,
  onCoverImageUrlChange,
  onCategoryIdChange,
  onStatusChange,
}: ArticleMetadataPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        {t("article.create.metadata")}
      </h2>

      <FormField htmlFor="article-title" label={t("form.title")}>
        <Input
          id="article-title"
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t("article.create.titlePlaceholder")}
          required
          value={title}
        />
      </FormField>

      <FormField htmlFor="article-cover-image-url" label={t("article.form.coverImageUrl")}>
        <Input
          id="article-cover-image-url"
          onChange={(e) => onCoverImageUrlChange(e.target.value)}
          placeholder={t("article.form.coverImagePlaceholder")}
          type="url"
          value={coverImageUrl}
        />
      </FormField>

      <FormField htmlFor="article-category" label={t("article.form.category")}>
        <Select
          id="article-category"
          onChange={(e) => onCategoryIdChange(e.target.value)}
          value={categoryId}
        >
          <option value="">{t("common.none")}</option>
          <option value="1">{t("article.category.news")}</option>
          <option value="2">{t("article.category.teaching")}</option>
          <option value="3">{t("article.category.devotional")}</option>
        </Select>
      </FormField>

      <FormField htmlFor="article-status" label={t("article.form.status")}>
        <Select
          id="article-status"
          onChange={(e) => onStatusChange(e.target.value === "published" ? "published" : "draft")}
          value={status}
        >
          <option value="draft">{t("course.form.status.draft")}</option>
          <option value="published">{t("course.form.status.published")}</option>
        </Select>
      </FormField>

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? t("article.create.submitting") : t("action.submit")}
      </Button>

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
      ) : null}
    </Card>
  );
}
