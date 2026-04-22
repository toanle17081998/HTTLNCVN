"use client";

import { cn } from "@/components/ui";

type ChurchLogoProps = {
  className?: string;
};

export function ChurchLogo({ className }: ChurchLogoProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block shrink-0",
        className,
      )}
    >
      <img
        alt=""
        className="church-logo-light absolute inset-0 h-full w-full object-contain"
        src="/church-logo.svg"
      />
      <img
        alt=""
        className="church-logo-dark absolute inset-0 h-full w-full object-contain"
        src="/church-logo-dark.svg?v=2"
      />
    </span>
  );
}
