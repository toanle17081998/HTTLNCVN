import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type TextTone = "brand" | "danger" | "gold" | "inherit" | "inverse" | "inverseMuted" | "primary" | "secondary" | "tertiary";
export type TextVariant = "action" | "body" | "caption" | "eyebrow" | "inherit" | "kicker" | "label" | "meta" | "overline" | "prose" | "relaxed" | "small";

const variantClasses: Record<TextVariant, string> = {
  action: "text-xs font-semibold uppercase tracking-[0.16em]",
  body: "text-base leading-7",
  caption: "text-xs leading-5",
  eyebrow: "text-xs font-bold uppercase tracking-[0.2em]",
  inherit: "",
  kicker: "text-xs font-semibold uppercase tracking-[0.18em]",
  label: "text-sm font-semibold",
  meta: "text-[10px] font-bold uppercase tracking-wider",
  overline: "text-xs font-bold uppercase tracking-wider",
  prose: "text-sm leading-6",
  relaxed: "text-sm leading-7",
  small: "text-sm",
};

const toneClasses: Record<TextTone, string> = {
  brand: "text-[var(--brand-primary)]",
  danger: "text-[var(--status-danger)]",
  gold: "text-[var(--accent-gold)]",
  inherit: "text-inherit",
  inverse: "text-[var(--text-inverse)]",
  inverseMuted: "text-[var(--text-inverse-muted)]",
  primary: "text-[var(--text-primary)]",
  secondary: "text-[var(--text-secondary)]",
  tertiary: "text-[var(--text-tertiary)]",
};

type TextProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "p" | "span";
  tone?: TextTone;
  variant?: TextVariant;
};

export function Text({ as: Component = "p", className, tone = "secondary", variant = "body", ...props }: TextProps) {
  return <Component className={cn(variantClasses[variant], toneClasses[tone], className)} {...props} />;
}
