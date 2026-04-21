import { localeLabels, locales } from "@/lib/i18n";
import { useTranslation } from "@/providers/I18nProvider";

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      aria-label="Language"
      className="inline-flex rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] p-0.5"
      role="group"
    >
      {locales.map((item) => {
        const isActive = item === locale;

        return (
          <button
            aria-pressed={isActive}
            className={
              isActive
                ? "h-8 rounded px-3 text-sm font-semibold text-[var(--brand-primary)]"
                : "h-8 rounded px-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
            }
            key={item}
            onClick={() => setLocale(item)}
            title={localeLabels[item]}
            type="button"
          >
            {item.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
