"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ParamUpdateValue = string | number | boolean | null | undefined;

type UseUrlPaginationOptions = {
  defaultPageSize: number;
  maxPageSize?: number;
  pageParam?: string;
  pageSizeParam?: string;
};

const POSITIVE_INT_RE = /^[1-9]\d*$/;
const MAX_PAGE_NUMBER = 10000;

export function isPositiveIntParam(value: string | null): boolean {
  return value !== null && POSITIVE_INT_RE.test(value);
}

export function toCategorySlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function matchesCategoryParam(param: string, names: ReadonlyArray<string | null | undefined>): boolean {
  const normalizedParam = param.trim().toLowerCase();
  if (!normalizedParam) return false;
  const slugParam = toCategorySlug(param);
  return names.some((name) => {
    if (!name) return false;
    const trimmed = name.trim().toLowerCase();
    return trimmed === normalizedParam || (slugParam !== "" && toCategorySlug(name) === slugParam);
  });
}

export function useUrlPagination({
  defaultPageSize,
  maxPageSize = 100,
  pageParam = "page",
  pageSizeParam = "pageSize",
}: UseUrlPaginationOptions) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawPageStr = searchParams.get(pageParam);
  const rawPage = isPositiveIntParam(rawPageStr) ? Number(rawPageStr) : NaN;
  const isPageInvalid = rawPageStr !== null && (!Number.isInteger(rawPage) || rawPage < 1 || rawPage > MAX_PAGE_NUMBER);
  const page = !isPageInvalid && Number.isInteger(rawPage) && rawPage >= 1 ? rawPage - 1 : 0;

  const rawPageSizeStr = searchParams.get(pageSizeParam);
  const rawPageSize = isPositiveIntParam(rawPageSizeStr) ? Number(rawPageSizeStr) : NaN;
  const isPageSizeInvalid =
    rawPageSizeStr !== null && (!Number.isInteger(rawPageSize) || rawPageSize < 1 || rawPageSize > maxPageSize);
  const pageSize =
    !isPageSizeInvalid && Number.isInteger(rawPageSize) && rawPageSize > 0
      ? rawPageSize
      : defaultPageSize;

  const isInvalidParams = isPageInvalid || isPageSizeInvalid;

  const isPageOutOfRange = useCallback(
    (total: number, isReady: boolean) =>
      isReady && page > 0 && page >= Math.max(1, Math.ceil(total / pageSize)),
    [page, pageSize],
  );

  const updateParams = useCallback(
    (updates: Record<string, ParamUpdateValue>) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === "" || value === false) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      const queryString = next.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
      const currentQuery = searchParams.toString();
      const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;
      if (nextUrl === currentUrl) return;

      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const safePage = Math.max(0, Math.floor(nextPage));
      updateParams({ [pageParam]: safePage > 0 ? safePage + 1 : null });
    },
    [pageParam, updateParams],
  );

  const setPageSize = useCallback(
    (nextSize: number) => {
      const safeSize = Math.max(1, Math.floor(nextSize));
      updateParams({
        [pageParam]: null,
        [pageSizeParam]: safeSize !== defaultPageSize ? safeSize : null,
      });
    },
    [defaultPageSize, pageParam, pageSizeParam, updateParams],
  );

  return {
    isInvalidParams,
    isPageOutOfRange,
    page,
    pageSize,
    searchParams,
    setPage,
    setPageSize,
    updateParams,
  };
}
