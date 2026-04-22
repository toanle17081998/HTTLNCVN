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

  if (pathname === "/auth") {
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
        <main className="min-w-0 flex-1 px-4 pb-8 pt-24 sm:px-6 md:pt-28 lg:px-8">
          <div className="mx-auto mb-4 w-full max-w-6xl">
            <Breadcrumb pathname={pathname} />
          </div>
          {children}
        </main>
        <Footer />
        <BackToTopButton />
      </div>
    </div>
  );
}
