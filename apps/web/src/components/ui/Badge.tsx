import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type BadgeVariant = "brand" | "danger" | "gold" | "neutral" | "outline" | "success" | "warning";
export type BadgeSize = "xs" | "sm" | "md";

const variantClasses: Record<BadgeVariant, string> = {
  brand: "bg-[var(--brand-muted)] text-[var(--brand-primary)]",
  danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger)]",
  gold: "bg-[color-mix(in_srgb,var(--accent-gold)_14%,var(--bg-surface))] text-[var(--accent-gold)]",
  neutral: "bg-[var(--bg-base)] text-[var(--text-secondary)]",
  outline: "border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)]",
  success: "bg-[var(--status-success-bg)] text-[var(--status-success)]",
  warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  pill?: boolean;
  size?: BadgeSize;
  uppercase?: boolean;
  variant?: BadgeVariant;
};

export function Badge({
  className,
  pill = false,
  size = "sm",
  uppercase = false,
  variant = "brand",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold",
        pill ? "rounded-full" : "rounded-md",
        uppercase && "uppercase tracking-wider",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
