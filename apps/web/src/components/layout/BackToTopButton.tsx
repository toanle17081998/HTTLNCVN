"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > 360);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      aria-label={t("action.backToTop")}
      className={cn(
        "fixed bottom-5 right-5 hover:cursor-pointer z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-lg transition-[opacity,transform,background-color] duration-200 hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)] sm:bottom-6 sm:right-6",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
      onClick={scrollToTop}
      type="button"
    >
      <ArrowUp aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
