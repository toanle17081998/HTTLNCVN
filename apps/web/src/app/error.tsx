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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
      <ErrorDisplay 
        statusCode={500} 
        message={error.message || "An unexpected error occurred."}
        reset={reset} 
      />
    </div>
  );
}
