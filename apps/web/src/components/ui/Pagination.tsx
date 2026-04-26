"use client";

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
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--text-secondary)]",
        className,
      )}
    >
      {/* Left: Display N of X records */}
      <div className="flex items-center gap-2">
        <span>Display</span>
        <select
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)] cursor-pointer"
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
          of <span className="font-semibold text-[var(--text-primary)]">{total}</span> records
        </span>
      </div>

      {/* Right: «  <  Page N / T  >  » */}
      <div className="flex items-center gap-1">
        <PagBtn
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          aria-label="First page"
        >
          «
        </PagBtn>
        <PagBtn
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
        >
          ‹
        </PagBtn>

        <span className="px-3 font-medium text-[var(--text-primary)]">
          Page {page + 1} / {totalPages}
        </span>

        <PagBtn
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          aria-label="Next page"
        >
          ›
        </PagBtn>
        <PagBtn
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page + 1 >= totalPages}
          aria-label="Last page"
        >
          »
        </PagBtn>
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
