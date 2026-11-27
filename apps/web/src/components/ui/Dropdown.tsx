import type { ComponentPropsWithRef } from "react";
import { cn } from "./cn";

type DropdownProps = ComponentPropsWithRef<"select">;

export function Dropdown({ className, multiple, size, ...props }: DropdownProps) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-base text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--input-focus-ring)]",
        !multiple && (size === undefined || size <= 1) && "ui-dropdown",
        className,
      )}
      multiple={multiple}
      size={size}
      {...props}
    />
  );
}
