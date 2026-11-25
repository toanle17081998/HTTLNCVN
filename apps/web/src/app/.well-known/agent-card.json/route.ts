import { absoluteUrl, siteConfig } from "@/lib/site";

export function GET() {
  return Response.json(
    {
      capabilities: {
        tools: [
          "get_page_context",
          "list_public_links",
          "search_public_content",
          "open_public_page",
          "open_public_content",
        ],
        webMcp: true,
      },
      description: `Browser-native WebMCP tools for exploring public articles, courses, and events on ${siteConfig.names.vi} (${siteConfig.shortNames.vi}) / ${siteConfig.names.en} (${siteConfig.shortNames.en}).`,
      documentationUrl: absoluteUrl("/llms.txt"),
      iconUrl: absoluteUrl("/church-favicon.webp"),
      languages: ["vi", "en"],
      name: `${siteConfig.shortNames.vi} / ${siteConfig.shortNames.en} Web Assistant`,
      organization: `${siteConfig.names.vi} (${siteConfig.names.en})`,
      sitemapUrl: absoluteUrl("/sitemap.xml"),
      url: absoluteUrl("/"),
      version: "1.1.0",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
