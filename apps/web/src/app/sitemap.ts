import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

type ApiEnvelope<T> = { data: T; success: true };
type ArticleResult = { items: Array<{ published_at: string | null; slug: string }> };
type CourseResult = { items: Array<{ published_at: string | null; slug: string }> };
type PageResult = { items: Array<{ route_path: string; updated_at: string }> };

async function fetchPublicApi<T>(path: string): Promise<T> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const response = await fetch(`${apiBaseUrl}/api${path}`, { next: { revalidate } });
  if (!response.ok) throw new Error(`Sitemap source request failed: ${response.status}`);
  const payload = await response.json() as ApiEnvelope<T>;
  if (!payload.success) throw new Error("Sitemap source returned an invalid response.");
  return payload.data;
}

const staticRoutes: Array<{
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  path: string;
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/article", changeFrequency: "daily", priority: 0.9 },
  { path: "/course", changeFrequency: "weekly", priority: 0.9 },
  { path: "/event", changeFrequency: "daily", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticRoutes.map(({ path, ...route }) => ({
    url: absoluteUrl(path),
    ...route,
  }));

  const [articles, courses, pages] = await Promise.allSettled([
    fetchPublicApi<ArticleResult>("/articles?status=published&take=1000"),
    fetchPublicApi<CourseResult>("/courses?status=published&take=1000"),
    fetchPublicApi<PageResult>("/pages?status=published"),
  ]);

  if (articles.status === "fulfilled") {
    entries.push(...articles.value.items.map((article) => ({
      url: absoluteUrl(`/article/${encodeURIComponent(article.slug)}`),
      lastModified: article.published_at || undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })));
  }

  if (courses.status === "fulfilled") {
    entries.push(...courses.value.items.map((course) => ({
      url: absoluteUrl(`/course/${encodeURIComponent(course.slug)}`),
      lastModified: course.published_at || undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })));
  }

  if (pages.status === "fulfilled") {
    const staticPaths = new Set(staticRoutes.map((route) => route.path));
    entries.push(...pages.value.items
      .filter((page) => page.route_path.startsWith("/") && !staticPaths.has(page.route_path))
      .map((page) => ({
        url: absoluteUrl(page.route_path),
        lastModified: page.updated_at,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })));
  }

  return entries;
}
