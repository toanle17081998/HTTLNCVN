"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BackToTopButton } from "./BackToTopButton";
import { Breadcrumb } from "./Breadcrumb";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { ThemeInitializer } from "./ThemeToggle";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showBreadcrumb = pathname.split("/").filter(Boolean).length > 1;

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
      <div className="flex min-w-0 flex-1 flex-col">
        <Header pathname={pathname} />
        <main className="min-w-0 flex-1 mt-16 md:mt-20">
          {showBreadcrumb && (
            <div className="mx-auto my-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <Breadcrumb pathname={pathname} />
            </div>
          )}
          {children}
        </main>
        <Footer />
        <BackToTopButton />
      </div>
    </div>
  );
}
