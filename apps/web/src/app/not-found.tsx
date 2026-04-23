import { ErrorDisplay } from "@/components/ErrorDisplay";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
      <ErrorDisplay statusCode={404} />
    </div>
  );
}
