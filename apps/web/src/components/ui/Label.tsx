import type { LabelHTMLAttributes } from "react";
import { cn } from "./cn";

export type LabelVariant = "caption" | "control" | "field" | "inherit" | "overline";

const variantClasses: Record<LabelVariant, string> = {
  caption: "text-xs font-semibold text-[var(--text-secondary)]",
  control: "text-sm font-medium text-[var(--text-primary)]",
  field: "text-sm font-semibold text-[var(--text-primary)]",
  inherit: "",
  overline: "text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]",
};

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  variant?: LabelVariant;
};

export function Label({ className, variant = "field", ...props }: LabelProps) {
  return <label className={cn(variantClasses[variant], className)} {...props} />;
}
