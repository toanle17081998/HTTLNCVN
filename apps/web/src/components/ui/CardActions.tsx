"use client";

import Link from "next/link";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "./Button";
import { cn } from "./cn";
import { canDeleteContent } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";

type CardActionsProps = {
  className?: string;
  deleting: boolean;
  editHref: string;
  onDelete: () => void;
  resource: "article" | "course";
};

const cardActionRoles = new Set(["editor", "admin", "church_admin", "system_admin"]);

export function CardActions({ className, deleting, editHref, onDelete, resource }: CardActionsProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  if (!user || !cardActionRoles.has(user.role)) return null;

  const canEdit = user.permissions.some((permission) => permission.resource === resource && permission.action === "update");
  const canDelete = canDeleteContent(user, resource);
  if (!canEdit && !canDelete) return null;

  return (
    <details
      className={cn("shrink-0", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !event.currentTarget.open) return;
        event.stopPropagation();
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      }}
    >
      <summary
        aria-label={t(resource === "article" ? "article.action.more" : "course.action.more")}
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] [&::-webkit-details-marker]:hidden"
      >
        <EllipsisVertical aria-hidden="true" className="h-5 w-5" />
      </summary>
      <div className="absolute right-0 top-full z-20 mt-1 grid w-max gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1 shadow-lg">
        {canEdit ? (
          <Link
            className="flex h-9 items-center rounded-md px-4 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
            href={editHref}
            onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
          >
            <Pencil aria-hidden="true" className="mr-2 h-4 w-4" />
            {t("admin.common.edit")}
          </Link>
        ) : null}
        {canDelete ? (
          <Button
            className="justify-start text-[var(--status-danger)]"
            disabled={deleting}
            onClick={(event) => {
              event.currentTarget.closest("details")?.removeAttribute("open");
              onDelete();
            }}
            size="sm"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />
            {t("admin.common.delete")}
          </Button>
        ) : null}
      </div>
    </details>
  );
}
