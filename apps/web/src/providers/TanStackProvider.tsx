"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "@services/client";

export function TanStackProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30_000,
            retry(failureCount, error) {
              if (error instanceof ApiError && error.status === 404) {
                return false;
              }
              if (error && typeof error === "object" && "status" in error && (error as any).status === 404) {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
