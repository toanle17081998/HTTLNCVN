"use client";

import { cn } from "@/components/ui";
import { Button } from "./Button";
import { useTranslation } from "@/providers/I18nProvider";

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
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-center gap-1 p-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg w-fit", className)}>
      <Button
        aria-pressed={activeLanguage === "en"}
        title={t("common.language.editContent", { language: t("common.language.english") })}
        type="button"
        variant="unstyled"
        onClick={() => onLanguageChange("en")}
        className={cn(
          "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
          activeLanguage === "en"
            ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-muted)]"
        )}
      >
        English
      </Button>
      <Button
        aria-pressed={activeLanguage === "vi"}
        title={t("common.language.editContent", { language: t("common.language.vietnamese") })}
        type="button"
        variant="unstyled"
        onClick={() => onLanguageChange("vi")}
        className={cn(
          "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
          activeLanguage === "vi"
            ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-muted)]"
        )}
      >
        Tiếng Việt
      </Button>
    </div>
  );
}
