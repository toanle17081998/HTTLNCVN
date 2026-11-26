"use client";

import {
  dehydrate,
  hydrate,
  IsRestoringProvider,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ApiError } from "@/api/client";
import { clearSessionQueryCache, sessionQueryCacheKey } from "@/lib/sessionQueryCache";

type StoredQueryCache = {
  state: ReturnType<typeof dehydrate>;
  version: 2;
};

const hydrationSensitiveQueryKeys = new Set(["articles", "course-categories", "courses", "pages"]);

function isHydrationSafeQuery(queryKey: readonly unknown[]) {
  return !hydrationSensitiveQueryKeys.has(String(queryKey[0]));
}

function restoreSessionCache(queryClient: QueryClient) {
  try {
    const raw = window.sessionStorage.getItem(sessionQueryCacheKey);
    if (!raw) return;
    const cached = JSON.parse(raw) as StoredQueryCache;
    if (cached.version !== 2 || !cached.state) {
      clearSessionQueryCache();
      return;
    }
    hydrate(queryClient, {
      ...cached.state,
      queries: cached.state.queries.filter((query) => isHydrationSafeQuery(query.queryKey)),
    });
  } catch {
    clearSessionQueryCache();
  }
}

function persistSessionCache(queryClient: QueryClient) {
  const dehydrated = dehydrate(queryClient, {
    shouldDehydrateQuery: (query) =>
      isHydrationSafeQuery(query.queryKey) &&
      query.state.status === "success",
  });
  let queries = [...dehydrated.queries]
    .sort((left, right) => right.state.dataUpdatedAt - left.state.dataUpdatedAt)
    .slice(0, 30);

  while (true) {
    try {
      const cache: StoredQueryCache = {
        state: { ...dehydrated, queries },
        version: 2,
      };
      window.sessionStorage.setItem(sessionQueryCacheKey, JSON.stringify(cache));
      return;
    } catch {
      if (queries.length <= 1) {
        clearSessionQueryCache();
        return;
      }
      queries = queries.slice(0, Math.floor(queries.length / 2));
    }
  }
}

export function TanStackProvider({ children }: { children: ReactNode }) {
  const [isRestoring, setIsRestoring] = useState(true);
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: 30 * 60 * 1000,
          refetchOnWindowFocus: false,
          staleTime: 60 * 1000,
          retry(failureCount, error) {
            const status =
              error instanceof ApiError
                ? error.status
                : error && typeof error === "object" && "status" in error && typeof error.status === "number"
                  ? error.status
                  : undefined;
            if (status !== undefined && status >= 400 && status < 500) {
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
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "success") return;
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(persist, 1000);
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
