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
          ? "gap-6 px-4 py-4 sm:px-6 lg:px-8"
          : "gap-12 px-4 pt-20 pb-20 sm:px-6 sm:pt-24 sm:pb-24 lg:px-8 lg:pt-28 lg:pb-32",
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
