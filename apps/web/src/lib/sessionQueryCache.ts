export const sessionQueryCacheKey = "httlncvn.query-cache.v1";

export function clearSessionQueryCache() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(sessionQueryCacheKey);
  } catch {
    // Storage may be unavailable in restricted browsing modes.
  }
}
