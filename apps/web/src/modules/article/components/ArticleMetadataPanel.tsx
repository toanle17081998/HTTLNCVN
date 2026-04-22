"use client";

import { Button, Card, FormField, Input, Select, Textarea } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { SubmitState } from "./articleEditorTypes";

type ArticleMetadataPanelProps = {
  title: string;
  excerpt: string;
  category: string;
  status: "draft" | "published";
  tags: string;
  isSubmitting: boolean;
  submitState: SubmitState;
  onTitleChange: (v: string) => void;
  onExcerptChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onStatusChange: (v: "draft" | "published") => void;
  onTagsChange: (v: string) => void;
};

export function ArticleMetadataPanel({
  title,
  excerpt,
  category,
  status,
  tags,
  isSubmitting,
  submitState,
  onTitleChange,
  onExcerptChange,
  onCategoryChange,
  onStatusChange,
  onTagsChange,
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

      <FormField htmlFor="article-excerpt" label="Excerpt">
        <Textarea
          id="article-excerpt"
          onChange={(e) => onExcerptChange(e.target.value)}
          placeholder={t("article.create.excerptPlaceholder")}
          rows={4}
          value={excerpt}
        />
      </FormField>

      <FormField htmlFor="article-category" label="Category">
        <Select
          id="article-category"
          onChange={(e) => onCategoryChange(e.target.value)}
          value={category}
        >
          <option value="community">Community</option>
          <option value="discipleship">Discipleship</option>
          <option value="event">Event</option>
          <option value="testimony">Testimony</option>
        </Select>
      </FormField>

      <FormField htmlFor="article-status" label="Status">
        <Select
          id="article-status"
          onChange={(e) => onStatusChange(e.target.value === "published" ? "published" : "draft")}
          value={status}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </Select>
      </FormField>

      <FormField htmlFor="article-tags" label="Tags">
        <Input
          id="article-tags"
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder={t("article.create.tagsPlaceholder")}
          value={tags}
        />
      </FormField>

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting..." : t("action.submit")}
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
