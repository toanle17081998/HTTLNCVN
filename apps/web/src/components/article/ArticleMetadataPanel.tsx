"use client";

import { Title, Button, Card, FormField, Input, Dropdown, Text } from "@/components/ui";
import { ImagePickerField } from "@/components/media/ImagePickerField";
import { useTranslation } from "@/providers/I18nProvider";
import { useArticleCategoriesQuery } from "@/hooks/article";
import type { SubmitState } from "./articleEditorTypes";
import { CategorySelect } from "./CategorySelect";

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
  const { t, locale } = useTranslation();
  const categoriesQuery = useArticleCategoriesQuery();

  return (
    <Card className="grid gap-4 p-5">
      <Title as="h2" variant="subsection">
        {t("article.create.metadata")}
      </Title>

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
        <ImagePickerField
          folder="articles"
          id="article-cover-image-url"
          onChange={onCoverImageUrlChange}
          placeholder={t("article.form.coverImagePlaceholder")}
          value={coverImageUrl}
        />
      </FormField>

      <FormField htmlFor="article-category" label={t("article.form.category")}>
        <CategorySelect
          categories={categoriesQuery.data ?? []}
          onChange={(val) => onCategoryIdChange(val)}
          placeholder={t("common.none")}
          value={categoryId}
        />
      </FormField>

      <FormField htmlFor="article-status" label={t("article.form.status")}>
        <Dropdown
          id="article-status"
          onChange={(e) => onStatusChange(e.target.value === "published" ? "published" : "draft")}
          value={status}
        >
          <option value="draft">{t("course.form.status.draft")}</option>
          <option value="published">{t("course.form.status.published")}</option>
        </Dropdown>
      </FormField>

      <Button variant="primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? t("article.create.submitting") : t("action.submit")}
      </Button>

      {submitState.message ? (
        <Text as="p" tone="inherit" variant="inherit"
          className={
            submitState.status === "success"
              ? "text-sm font-medium text-[var(--status-success)]"
              : "text-sm font-medium text-[var(--status-danger)]"
          }
        >
          {submitState.message}
        </Text>
      ) : null}
    </Card>
  );
}
