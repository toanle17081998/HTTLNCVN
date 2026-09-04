"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { ApiError } from "@/services/client";
import {
  useCreatePageMutation,
  usePageQuery,
} from "@/services/page";
import {
  createDefaultPageContent,
  pageLayoutTemplates,
  slugifyPageTitle,
  type PageLayoutTemplateId,
} from "../defaultContent";

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (slug: string) => void;
}

export function CreatePageModal({ isOpen, onClose, onCreated }: CreatePageModalProps) {
  const [title, setTitle] = useState("");
  const [routePath, setRoutePath] = useState("");
  const [isRouteModified, setIsRouteModified] = useState(false);
  const [templateId, setTemplateId] = useState<PageLayoutTemplateId>("welcome");
  const createPage = useCreatePageMutation();
  const homePageQuery = usePageQuery(templateId === "welcome" ? "home" : undefined);
  const { toast } = useFeedback();
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setRoutePath("");
      setIsRouteModified(false);
      setTemplateId("welcome");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!isRouteModified) {
      const slug = slugifyPageTitle(value);
      setRoutePath(slug === "new-page" ? "" : `/${slug}`);
    }
  }

  function handleRouteChange(value: string) {
    setRoutePath(value);
    setIsRouteModified(true);
  }

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanRoute = routePath.trim();
    const finalRoute = cleanRoute ? (cleanRoute.startsWith("/") ? cleanRoute : `/${cleanRoute}`) : "/";
    const slug = slugifyPageTitle(finalRoute === "/" ? "home" : finalRoute);

    try {
      const defaultContent =
        templateId === "welcome" && homePageQuery.data?.content_en
          ? homePageQuery.data.content_en
          : createDefaultPageContent(title || "New page", finalRoute, templateId);

      const defaultContentVi =
        templateId === "welcome" && homePageQuery.data?.content_vi
          ? homePageQuery.data.content_vi
          : defaultContent;

      await createPage.mutateAsync({
        content_en: defaultContent,
        content_vi: defaultContentVi,
        route_path: finalRoute,
        slug,
        title_en: title || "New page",
        title_vi: title || "Trang mới",
      });

      toast({ title: t("toast.page.created"), variant: "success" });
      onCreated(slug);
      onClose();
    } catch (error) {
      toast({
        description: error instanceof ApiError ? error.message : undefined,
        title: t("toast.page.createFailed"),
        variant: "error",
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-2xl animate-in zoom-in-95 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              {t("pageBuilder.createPage")}
            </p>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {t("pageBuilder.newPage")}
            </h3>
          </div>
          <button
            aria-label="Close"
            className="rounded-lg border border-[var(--border-subtle)] p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 p-6">
          <label className="grid gap-1.5 text-sm font-medium text-[var(--text-primary)]">
            <span>{t("form.title")}</span>
            <Input
              autoFocus
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Giới thiệu / About Us"
              value={title}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-[var(--text-primary)]">
            <span>{t("pageBuilder.routePath")}</span>
            <Input
              onChange={(e) => handleRouteChange(e.target.value)}
              placeholder="/gioi-thieu"
              value={routePath}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-[var(--text-primary)]">
            <span>{t("pageBuilder.starterLayout")}</span>
            <Select
              onChange={(e) => setTemplateId(e.target.value as PageLayoutTemplateId)}
              value={templateId}
            >
              {pageLayoutTemplates.map((template) => {
                const name = t(`pageBuilder.template.${template.id}.name` as any) || template.name;
                const desc = t(`pageBuilder.template.${template.id}.desc` as any) || template.description;
                return (
                  <option key={template.id} value={template.id}>
                    {name}: {desc}
                  </option>
                );
              })}
            </Select>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button onClick={onClose} type="button" variant="secondary">
              {t("action.cancel")}
            </Button>
            <Button
              isLoading={createPage.isPending || (templateId === "welcome" && homePageQuery.isLoading)}
              type="submit"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("pageBuilder.createAction")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
