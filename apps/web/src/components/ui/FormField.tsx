import type { ReactNode } from "react";
import { cn } from "./cn";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label
        className="text-sm font-semibold text-[var(--text-primary)]"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p className="text-sm leading-5 text-[var(--text-secondary)]">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium leading-5 text-[var(--status-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
