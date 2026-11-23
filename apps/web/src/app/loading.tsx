import { ChurchLogo } from "@/components/layout/ChurchLogo";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--bg-app)]" role="status">
      <ChurchLogo className="h-28 w-28 drop-shadow-2xl sm:h-36 sm:w-36 lg:h-60 lg:w-60" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
