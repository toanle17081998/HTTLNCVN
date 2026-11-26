"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";
import { PageHeader } from "./PageHeader";

type PageLayoutProps = {
  actions?: ReactNode;
  align?: "left" | "center";
  children: ReactNode;
  coverImage?: string;
  description?: string;
  eyebrow?: string;
  image?: string;
  showHeroImage?: boolean;
  title: string;
};

export function PageLayout({
  actions,
  align,
  children,
  coverImage,
  description,
  eyebrow,
  image,
  showHeroImage,
  title,
}: PageLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-7xl min-w-0",
        isAdmin
          ? "gap-5 py-2 sm:gap-6 sm:py-3"
          : "gap-12 px-4 pt-[calc(var(--section-space-xl)_-_var(--section-space-md))] pb-20 sm:px-6 sm:pb-24 md:pt-24 lg:px-8 lg:pt-28 lg:pb-32",
      )}
    >
      <PageHeader
        actions={actions}
        align={align}
        coverImage={coverImage}
        description={description}
        eyebrow={eyebrow}
        image={image}
        showHeroImage={showHeroImage}
        title={title}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
