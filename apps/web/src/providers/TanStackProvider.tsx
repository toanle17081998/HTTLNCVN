"use client";

import {
  dehydrate,
  hydrate,
  IsRestoringProvider,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ApiError } from "@/services/client";
import { clearSessionQueryCache, sessionQueryCacheKey } from "@/lib/sessionQueryCache";

type StoredQueryCache = {
  state: ReturnType<typeof dehydrate>;
  version: 1;
};

function restoreSessionCache(queryClient: QueryClient) {
  try {
    const raw = window.sessionStorage.getItem(sessionQueryCacheKey);
    if (!raw) return;
    const cached = JSON.parse(raw) as StoredQueryCache;
    if (cached.version !== 1 || !cached.state) {
      clearSessionQueryCache();
      return;
    }
    hydrate(queryClient, {
      ...cached.state,
      queries: cached.state.queries.filter(
        (query) => query.queryKey[0] !== "pages" && query.queryKey[0] !== "courses",
      ),
    });
  } catch {
    clearSessionQueryCache();
  }
}

function persistSessionCache(queryClient: QueryClient) {
  const dehydrated = dehydrate(queryClient, {
    shouldDehydrateQuery: (query) =>
      query.queryKey[0] !== "pages" &&
      query.queryKey[0] !== "courses" &&
      query.state.status === "success",
  });
  const queries = [...dehydrated.queries].sort(
    (left, right) => right.state.dataUpdatedAt - left.state.dataUpdatedAt,
  );

  while (true) {
    try {
      const cache: StoredQueryCache = {
        state: { ...dehydrated, queries },
        version: 1,
      };
      window.sessionStorage.setItem(sessionQueryCacheKey, JSON.stringify(cache));
      return;
    } catch {
      if (!queries.length) {
        clearSessionQueryCache();
        return;
      }
      queries.pop();
    }
  }
}

export function TanStackProvider({ children }: { children: ReactNode }) {
  const [isRestoring, setIsRestoring] = useState(true);
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: Infinity,
          refetchOnWindowFocus: false,
          staleTime: Infinity,
          retry(failureCount, error) {
            if (error instanceof ApiError && error.status === 404) {
              return false;
            }
            if (error && typeof error === "object" && "status" in error && error.status === 404) {
              return false;
            }
            return failureCount < 3;
          },
        },
      },
    });
    return client;
  });

  useEffect(() => {
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    const persist = () => persistSessionCache(queryClient);
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(persist, 150);
    });
    const restoreTimer = setTimeout(() => {
      restoreSessionCache(queryClient);
      setIsRestoring(false);
    }, 0);
    window.addEventListener("pagehide", persist);

    return () => {
      clearTimeout(restoreTimer);
      if (saveTimer) clearTimeout(saveTimer);
      persist();
      unsubscribe();
      window.removeEventListener("pagehide", persist);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  );
}
