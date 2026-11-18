import { absoluteUrl, siteConfig } from "@/lib/site";

export function GET() {
  return Response.json({
    capabilities: {
      tools: ["get_page_context", "open_public_page", "open_public_content"],
    },
    description: `Browser-native tools for navigating public content on ${siteConfig.name}.`,
    documentationUrl: absoluteUrl("/llms.txt"),
    name: `${siteConfig.shortName} Web Assistant`,
    url: absoluteUrl("/"),
    version: "1.0.0",
  });
}
