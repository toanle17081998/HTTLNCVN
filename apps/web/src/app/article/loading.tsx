import { Card, Skeleton } from "@/components/ui";

export default function ArticleLoading() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-20 pt-20 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8 lg:pb-32 lg:pt-28">
      <div className="grid items-start gap-8 py-[var(--section-space-md)] lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-[var(--section-space-md)]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full max-w-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-full max-w-xl" />
            <Skeleton className="h-5 w-4/5 max-w-lg" />
          </div>
        </div>
        <Skeleton className="h-[clamp(18rem,30vw,25rem)] w-full rounded-[var(--section-radius-card)]" />
      </div>
      <div>
        <div className="mb-4 flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="mb-8 flex gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card className="overflow-hidden" key={i}>
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="space-y-4 p-6">
                <div className="flex justify-between gap-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-4/5" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
