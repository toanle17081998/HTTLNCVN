"use client";

import { useEditor } from "@craftjs/core";
import Link from "next/link";
import { cn } from "@/components/ui";
import type { FeedCardStyle } from "../../shared/types";

export type FeedCardProps = {
  accent?: string;
  coverImage?: string | null;
  description: string;
  href: string;
  isActive?: boolean;
  kicker: string;
  style?: FeedCardStyle;
  title: string;
};

export function FeedCard({
  accent,
  coverImage,
  description,
  href,
  isActive = false,
  kicker,
  style = "cinematic",
  title,
}: FeedCardProps) {
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const accentColor = accent || "var(--accent-gold)";
  const hasRealCover = Boolean(coverImage && coverImage.trim());

  const cinematicCover = hasRealCover ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={title}
      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      src={coverImage || ""}
    />
  ) : (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(circle at 20% 20%, color-mix(in srgb, ${accentColor} 30%, var(--bg-card)) 0%, var(--bg-card-strong) 70%)`,
      }}
    />
  );

  const cinematicContent = (
    <div className="relative aspect-[4/5] min-h-[22rem] w-full overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 text-[var(--text-inverse)] shadow-[var(--shadow-md)]">
      {cinematicCover}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-overlay)] via-black/45 to-transparent" />
      <div className="relative flex h-full flex-col justify-between">
        <span
          className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{
            borderColor: `color-mix(in srgb, ${accentColor} 45%, var(--border-subtle))`,
            color: accentColor,
          }}
        >
          {kicker}
        </span>
        <div className="grid gap-2">
          <h3 className="line-clamp-2 text-2xl font-semibold leading-tight text-[var(--text-inverse)]">{title}</h3>
          <p className="line-clamp-3 text-sm leading-6 text-[var(--text-inverse-muted)]">{description}</p>
        </div>
      </div>
    </div>
  );

  const cover = (
    <div className="relative min-h-44 overflow-hidden bg-[var(--bg-card-strong)]">
      {hasRealCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          src={coverImage || ""}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(145deg, color-mix(in srgb, ${accentColor} 20%, var(--bg-card)) 0%, var(--bg-card-strong) 100%)` }}
        />
      )}
    </div>
  );

  const editorialContent = (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm">
      <div className="aspect-[16/9] w-full shrink-0 overflow-hidden bg-[var(--bg-card-strong)]">{cover}</div>
      <div className="flex flex-1 flex-col justify-between gap-3 p-5">
        <div className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-gold)]">{kicker}</span>
          <h3 className="line-clamp-2 text-xl font-semibold leading-tight text-[var(--text-primary)]">{title}</h3>
          <p className="line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
    </div>
  );

  const minimalContent = (
    <div className="flex h-full min-h-72 flex-col justify-between border-y border-[var(--border-strong)] bg-transparent px-2 py-6">
      <div className="grid gap-4">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--accent-gold)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{kicker}</span>
        </div>
        <h3 className="max-w-xl text-3xl font-semibold leading-tight text-[var(--text-primary)]">{title}</h3>
        <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
      </div>
      <span className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">Read more</span>
    </div>
  );

  const splitContent = (
    <div className="grid h-full min-h-72 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] sm:grid-cols-[0.9fr_1.1fr]">
      {cover}
      <div className="flex flex-col justify-center gap-4 p-6">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-gold)]">{kicker}</span>
        <h3 className="text-2xl font-semibold leading-tight text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">View details</span>
      </div>
    </div>
  );

  const cardContent = style === "editorial"
    ? editorialContent
    : style === "minimal"
      ? minimalContent
      : style === "split"
        ? splitContent
        : cinematicContent;

  const sharedClassName = cn(
    "group relative flex h-full w-full flex-col overflow-hidden transition duration-500",
    style === "cinematic" && "rounded-[2rem]",
    isActive ? "scale-100 opacity-100 shadow-[var(--shadow-lg)]" : "scale-[0.94] opacity-55",
  );

  if (enabled) {
    return (
      <div className={sharedClassName}>
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      className={sharedClassName}
      href={href}
    >
      {cardContent}
    </Link>
  );
}
