"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useScrollDirectionVisibility } from "./useScrollDirectionVisibility";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { isVisible: isMobileNavVisible } = useScrollDirectionVisibility();
  const { t } = useTranslation();

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > 360);
    }

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
        "fixed right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-lg transition-[bottom,opacity,transform,background-color] duration-300 hover:cursor-pointer hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)] sm:right-6 lg:bottom-6",
        isMobileNavVisible
          ? "bottom-[calc(5rem+env(safe-area-inset-bottom))]"
          : "bottom-5",
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
