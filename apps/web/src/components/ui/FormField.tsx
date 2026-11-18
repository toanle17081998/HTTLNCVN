import { Text } from "@/components/ui";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { Label } from "./Label";

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
      <Label htmlFor={htmlFor} variant="field">
        {label}
      </Label>
      {children}
      {hint ? (
        <Text as="p" tone="inherit" variant="inherit" className="text-sm leading-5 text-[var(--text-secondary)]">{hint}</Text>
      ) : null}
      {error ? (
        <Text as="p" tone="inherit" variant="inherit" className="text-sm font-medium leading-5 text-[var(--status-danger)]">
          {error}
        </Text>
      ) : null}
    </div>
  );
}
