import { absoluteUrl, getSiteUrl, siteConfig } from "@/lib/site";

export function GET() {
  const hostname = getSiteUrl().hostname.replace(/[^a-z0-9.-]/gi, "-");
  const identifier = `urn:air:${hostname}:httlnc:web-assistant`;

  return Response.json(
    {
      "@context": "https://agenticresourcediscovery.org/context/v1",
      entries: [
        {
          "@context": "https://agenticresourcediscovery.org/context/v1",
          "@id": identifier,
          capabilities: [
            "PageContext",
            "PublicNavigation",
            "ContentNavigation",
            "ContentSearch",
            "LinkDiscovery",
          ],
          description: `Browse public articles, Bible courses, events, and pages on ${siteConfig.names.vi} (${siteConfig.shortNames.vi}) / ${siteConfig.names.en} (${siteConfig.shortNames.en}).`,
          displayName: `${siteConfig.shortNames.vi} / ${siteConfig.shortNames.en} Web Assistant`,
          documentationUrl: absoluteUrl("/llms.txt"),
          identifier,
          representativeQueries: [
            `Tìm bài viết trên ${siteConfig.names.vi}`,
            `Tìm khóa học Kinh Thánh trên ${siteConfig.shortNames.vi}`,
            `Show me articles on ${siteConfig.names.en} (${siteConfig.shortNames.en})`,
            `Find a course on ${siteConfig.shortNames.en}`,
            "What public content is available on this page?",
          ],
          type: "application/agent-card+json",
          url: absoluteUrl("/.well-known/agent-card.json"),
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
