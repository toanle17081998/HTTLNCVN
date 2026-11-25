import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "iconSm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm hover:brightness-95",
  secondary:
    "border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--brand-muted)]",
  ghost:
    "border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]",
  danger:
    "border-transparent bg-[var(--status-danger)] text-[var(--text-inverse)] shadow-sm hover:brightness-95",
  link:
    "border-transparent bg-transparent text-inherit hover:text-[var(--brand-primary)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9 p-0 shrink-0",
  iconSm: "h-8 w-8 p-0 shrink-0",
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  size = "md",
  isLoading,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-md border font-semibold transition hover:cursor-pointer focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)] disabled:pointer-events-none disabled:opacity-55",
        variantClasses[variant],
        variant === "link" ? "justify-start" : cn("justify-center", sizeClasses[size]),
        className,
      )}
      type={type}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
};

export function ButtonLink({
  className,
  variant = "link",
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={cn(
        "inline-flex items-center rounded-md border font-semibold transition focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]",
        variantClasses[variant],
        variant === "link" ? "justify-start" : "h-10 justify-center px-5 text-sm",
        className,
      )}
      {...props}
    />
  );
}

