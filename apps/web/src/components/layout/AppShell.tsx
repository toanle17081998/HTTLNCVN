"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { Header } from "./Header";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="flex min-w-0 flex-1 flex-col">
        <Header pathname={pathname} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
