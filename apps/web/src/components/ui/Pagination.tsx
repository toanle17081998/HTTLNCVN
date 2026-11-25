"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "@/providers/I18nProvider";
import { cn } from "./cn";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-between gap-3 py-2 text-sm text-[var(--text-secondary)] sm:flex-row",
        className,
      )}
    >
      {/* Left: Display N of X records */}
      <div className="flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-start">
        <span>{t("pagination.display")}</span>
        <select
          aria-label={t("pagination.display")}
          className="cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)]"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange?.(Number(e.target.value));
            onPageChange(0);
          }}
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span>
          {t("pagination.of")}{" "}
          <span className="font-semibold text-[var(--text-primary)]">{total}</span>{" "}
          {t("pagination.records")}
        </span>
      </div>

      <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end">
        <div className="flex items-center gap-1">
          <PagBtn
            onClick={() => onPageChange(0)}
            disabled={safePage === 0}
            aria-label={t("pagination.first")}
          >
            <ChevronsLeft className="h-4 w-4" />
          </PagBtn>
          <PagBtn
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 0}
            aria-label={t("pagination.previous")}
          >
            <ChevronLeft className="h-4 w-4" />
          </PagBtn>
        </div>

        <span className="px-3 text-center font-medium text-[var(--text-primary)]">
          {t("pagination.pageOf", { page: String(safePage + 1), total: String(totalPages) })}
        </span>

        <div className="flex items-center gap-1">
          <PagBtn
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage + 1 >= totalPages}
            aria-label={t("pagination.next")}
          >
            <ChevronRight className="h-4 w-4" />
          </PagBtn>
          <PagBtn
            onClick={() => onPageChange(totalPages - 1)}
            disabled={safePage + 1 >= totalPages}
            aria-label={t("pagination.last")}
          >
            <ChevronsRight className="h-4 w-4" />
          </PagBtn>
        </div>
      </div>
    </div>
  );
}

function PagBtn({
  children,
  disabled,
  onClick,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] text-sm font-medium transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "cursor-pointer hover:border-[var(--brand-primary)] hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
