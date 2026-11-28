"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BackToTopButton } from "./BackToTopButton";
import { Breadcrumb } from "./Breadcrumb";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { LandingIntro } from "./LandingIntro";
import { ThemeInitializer } from "./ThemeToggle";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showBreadcrumb = pathname.split("/").filter(Boolean).length > 1;
  const pageContentRef = useRef<HTMLDivElement>(null);
  const introWasMounted = useRef(false);
  const [showLandingIntro, setShowLandingIntro] = useState(pathname === "/");
  const completeLandingIntro = useCallback(() => setShowLandingIntro(false), []);

  useEffect(() => {
    if (pathname === "/" && showLandingIntro) {
      introWasMounted.current = true;
    } else if (pathname !== "/" && introWasMounted.current) {
      setShowLandingIntro(false);
    }
  }, [pathname, showLandingIntro]);

  useEffect(() => {
    let animation: Animation | undefined;
    const playAppearAnimation = () => {
      animation?.cancel();
      animation = pageContentRef.current?.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 800, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    };
    window.addEventListener("httlncvn:page-appear", playAppearAnimation);
    return () => {
      window.removeEventListener("httlncvn:page-appear", playAppearAnimation);
      animation?.cancel();
    };
  }, []);

  if (pathname === "/auth" || pathname.startsWith("/admin")) {
    return (
      <div className="min-h-screen overflow-x-clip bg-[var(--bg-base)] text-[var(--text-primary)]">
        <ThemeInitializer />
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-x-clip bg-[var(--bg-base)] text-[var(--text-primary)]">
      <ThemeInitializer />
      {pathname === "/" && showLandingIntro ? (
        <ErrorBoundary fallback={null} resetKey={pathname}>
          <LandingIntro onComplete={completeLandingIntro} />
        </ErrorBoundary>
      ) : null}
      <div className="relative flex min-w-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <ErrorBoundary fallback={null} resetKey={pathname}>
          <Header pathname={pathname} />
        </ErrorBoundary>
        <main ref={pageContentRef} className="min-w-0 flex-1 mt-16 md:mt-20">
          {showBreadcrumb && (
            <div className="mx-auto my-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <ErrorBoundary fallback={null} resetKey={pathname}>
                <Breadcrumb pathname={pathname} />
              </ErrorBoundary>
            </div>
          )}
          <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
        </main>
        <ErrorBoundary fallback={null} resetKey={pathname}>
          <Footer />
        </ErrorBoundary>
        <BackToTopButton />
      </div>
    </div>
  );
}
