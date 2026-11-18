import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type TitleVariant = "card" | "cardSoft" | "cardSoftTight" | "cardTight" | "display" | "feature" | "headline" | "inherit" | "label" | "labelStrong" | "micro" | "microSoft" | "modal" | "page" | "pageHeavy" | "pagePlain" | "pageSoft" | "section" | "sectionPlain" | "sectionSoft" | "subsection" | "subsectionStrong";
export type TitleTone = "brand" | "inherit" | "inverse" | "primary" | "secondary" | "tertiary";

const variantClasses: Record<TitleVariant, string> = {
  card: "text-xl font-bold",
  cardSoft: "text-xl font-semibold",
  cardSoftTight: "text-xl font-semibold leading-tight",
  cardTight: "text-xl font-bold leading-tight",
  display: "text-4xl font-bold tracking-tight sm:text-5xl",
  feature: "text-3xl font-semibold leading-tight",
  headline: "text-2xl font-semibold leading-tight",
  inherit: "",
  label: "text-base font-semibold",
  labelStrong: "text-base font-bold",
  micro: "text-sm font-bold",
  microSoft: "text-sm font-semibold",
  modal: "text-2xl font-semibold",
  page: "text-3xl font-bold tracking-tight sm:text-4xl",
  pageHeavy: "text-3xl font-black tracking-tight",
  pagePlain: "text-3xl font-bold",
  pageSoft: "text-3xl font-semibold tracking-tight sm:text-4xl",
  section: "text-2xl font-bold tracking-tight",
  sectionPlain: "text-2xl font-bold",
  sectionSoft: "text-2xl font-semibold",
  subsection: "text-lg font-semibold",
  subsectionStrong: "text-lg font-bold",
};

const toneClasses: Record<TitleTone, string> = {
  brand: "text-[var(--brand-primary)]",
  inherit: "text-inherit",
  inverse: "text-[var(--text-inverse)]",
  primary: "text-[var(--text-primary)]",
  secondary: "text-[var(--text-secondary)]",
  tertiary: "text-[var(--text-tertiary)]",
};

type TitleProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  tone?: TitleTone;
  variant?: TitleVariant;
};

export function Title({ as: Component = "h2", className, tone = "primary", variant = "section", ...props }: TitleProps) {
  return (
    <Component
      className={cn(variantClasses[variant], toneClasses[tone], className)}
      {...props}
    />
  );
}
