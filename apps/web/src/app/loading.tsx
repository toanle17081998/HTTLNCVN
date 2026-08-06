import { ChurchLogo } from "@/components/layout/ChurchLogo";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[var(--bg-base)] px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner Skeleton / Pulsing Branding */}
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute h-24 w-24 animate-ping rounded-full bg-[var(--accent-gold-muted)] opacity-60" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--bg-surface)] p-3 shadow-xl ring-1 ring-[var(--border-subtle)]">
              <ChurchLogo className="h-12 w-12 animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--accent-gold)]/40 mb-2" />
          <div className="h-8 w-64 animate-pulse rounded bg-[var(--text-primary)]/20" />
        </div>

        {/* Content Skeleton Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
