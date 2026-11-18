import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

export type InputVariant = "control" | "default" | "unstyled";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: InputVariant;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type, variant, ...props },
  ref,
) {
  const resolvedVariant = variant ?? (type === "checkbox" || type === "radio" ? "control" : "default");

  return (
    <input
      className={cn(
        resolvedVariant === "default" && "h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--input-focus-ring)]",
        resolvedVariant === "control" && "h-4 w-4 rounded border-[var(--border-strong)] text-[var(--brand-primary)] focus:ring-[var(--input-focus-ring)]",
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  );
});
