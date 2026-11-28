"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/ErrorDisplay";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const devMessage = process.env.NODE_ENV === "development" ? error.message : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
      <ErrorDisplay
        statusCode={500}
        message={devMessage}
        reset={reset}
      />
    </div>
  );
}
