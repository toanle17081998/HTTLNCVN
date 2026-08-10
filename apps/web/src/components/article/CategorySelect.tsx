"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTranslation } from "@/providers/I18nProvider";
import { type ArticleCategory } from "@/services/article";

type CategorySelectProps = {
  categories: ArticleCategory[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = "Select category",
}: CategorySelectProps) {
  const { locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCat = categories.find((c) => String(c.id) === value);
  const selectedLabel = selectedCat
    ? locale === "vi"
      ? selectedCat.name_vi || selectedCat.name_en
      : selectedCat.name_en || selectedCat.name_vi
    : placeholder;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnter = (id: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveTooltipId(id);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setActiveTooltipId(null);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    handleMouseLeave();
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        className="flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition hover:border-[var(--brand-primary)] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--input-focus-ring)]"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <span className={!selectedCat ? "text-[var(--text-tertiary)]" : "font-medium"}>
          {selectedLabel}
        </span>
        <ChevronDown
          className="h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[240px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
              value === ""
                ? "bg-[var(--brand-muted)] text-[var(--brand-primary)] font-semibold"
                : "text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
            }`}
            onClick={() => handleSelect("")}
          >
            <span>{placeholder}</span>
            {value === "" && <Check className="h-4 w-4" />}
          </div>

          {categories.map((cat) => {
            const name = locale === "vi" ? cat.name_vi || cat.name_en : cat.name_en || cat.name_vi;
            const description =
              locale === "vi"
                ? cat.description_vi || cat.description_en
                : cat.description_en || cat.description_vi;
            const isSelected = String(cat.id) === value;
            const showTooltip = activeTooltipId === cat.id && Boolean(description);

            return (
              <div
                className={`relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[var(--brand-muted)] text-[var(--brand-primary)] font-semibold"
                    : "text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
                }`}
                key={cat.id}
                onClick={() => handleSelect(String(cat.id))}
                onMouseEnter={() => handleMouseEnter(cat.id)}
                onMouseLeave={handleMouseLeave}
              >
                <span>{name}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0" />}

                {/* Tooltip on 300ms hover delay */}
                {showTooltip && (
                  <div className="absolute left-0 sm:left-full top-full sm:top-1/2 sm:-translate-y-1/2 mt-1 sm:mt-0 sm:ml-3 z-50 w-64 max-w-[calc(100vw-32px)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="font-bold text-[var(--brand-primary)] text-sm mb-1">{name}</div>
                    <div className="text-[var(--text-secondary)] leading-relaxed font-normal">{description}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
