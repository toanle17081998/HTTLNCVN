import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-5 border-b border-[var(--border-subtle)] pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 break-words text-3xl font-semibold leading-tight text-[var(--text-primary)] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
