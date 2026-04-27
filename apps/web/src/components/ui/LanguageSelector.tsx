"use client";

import { cn } from "@/components/ui";

type LanguageSelectorProps = {
  activeLanguage: "en" | "vi";
  onLanguageChange: (lang: "en" | "vi") => void;
  className?: string;
};

export function LanguageSelector({
  activeLanguage,
  onLanguageChange,
  className,
}: LanguageSelectorProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg w-fit", className)}>
      <button
        type="button"
        onClick={() => onLanguageChange("en")}
        className={cn(
          "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
          activeLanguage === "en"
            ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-muted)]"
        )}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => onLanguageChange("vi")}
        className={cn(
          "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
          activeLanguage === "vi"
            ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-muted)]"
        )}
      >
        Tiếng Việt
      </button>
    </div>
  );
}
