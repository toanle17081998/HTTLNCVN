import { Card, Skeleton } from "@/components/ui";

export function CourseDetailSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-20 pt-20 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8 lg:pb-32 lg:pt-28">
      <section className="grid max-w-3xl gap-6 py-[var(--section-space-md)]">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-3">
          <Skeleton className="h-16 w-full max-w-2xl sm:h-20" />
          <Skeleton className="h-16 w-3/5 max-w-md sm:h-20" />
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Card className="p-5" key={item}>
            <div className="grid gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full max-w-lg" />
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
