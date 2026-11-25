import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    host: getSiteUrl().origin,
    rules: {
      userAgent: "*",
      allow: ["/", "/llms.txt", "/.well-known/"],
      disallow: [
        "/admin/",
        "/api/",
        "/auth",
        "/church",
        "/create-article",
        "/notification",
        "/prayer-journal",
        "/course/create",
        "/course/*/edit",
        "/course/*/lesson/",
        "/course/quiz/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
