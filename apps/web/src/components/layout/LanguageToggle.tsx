import { localeLabels, locales } from "@/lib/i18n";
import { useTranslation } from "@/providers/I18nProvider";
import { cn } from "@/components/ui";

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      aria-label="Language"
      className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-1 shadow-inner"
      role="group"
    >
      {locales.map((item) => {
        const isActive = item === locale;

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              "h-7 rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
              isActive
                ? "bg-[var(--bg-surface)] text-[var(--brand-primary)] shadow-sm ring-1 ring-black/5"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
            key={item}
            onClick={() => setLocale(item)}
            title={localeLabels[item]}
            type="button"
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

