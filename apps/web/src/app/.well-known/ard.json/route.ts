import { absoluteUrl, getSiteUrl, siteConfig } from "@/lib/site";

export function GET() {
  const hostname = getSiteUrl().hostname.replace(/[^a-z0-9.-]/gi, "-");
  const identifier = `urn:air:${hostname}:htnc:web-assistant`;

  return Response.json({
    "@context": "https://agenticresourcediscovery.org/context/v1",
    entries: [
      {
        "@context": "https://agenticresourcediscovery.org/context/v1",
        "@id": identifier,
        capabilities: ["PageContext", "PublicNavigation", "ContentNavigation"],
        description: `Browse public articles, courses, events, and pages on ${siteConfig.name}.`,
        displayName: `${siteConfig.shortName} Web Assistant`,
        identifier,
        representativeQueries: [
          `Show me articles on ${siteConfig.shortName}`,
          `Find a course on ${siteConfig.shortName}`,
          "What public content is available on this page?",
        ],
        type: "application/agent-card+json",
        url: absoluteUrl("/.well-known/agent-card.json"),
      },
    ],
  });
}
