import { absoluteUrl, siteConfig } from "@/lib/site";

export const revalidate = 3600;

export function GET() {
  const content = `# ${siteConfig.names.vi} (${siteConfig.shortNames.vi}) / ${siteConfig.names.en} (${siteConfig.shortNames.en})

> ${siteConfig.descriptions.vi}
> ${siteConfig.descriptions.en}

## Public sections

- [Trang chủ / Home](${absoluteUrl("/")}): Church highlights, featured articles, and courses.
- [Bài viết / Articles](${absoluteUrl("/article")}): Published articles, devotionals, and church announcements.
- [Khóa học / Courses](${absoluteUrl("/course")}): Published Bible and discipleship courses.
- [Sự kiện / Events](${absoluteUrl("/event")}): Upcoming church gatherings, services, and community events.
- [Giới thiệu / About](${absoluteUrl("/about")}): Information about ${siteConfig.names.vi} (${siteConfig.shortNames.vi}) / ${siteConfig.names.en} (${siteConfig.shortNames.en}).
- [Liên hệ / Contact](${absoluteUrl("/contact")}): Public contact information.

## Machine-readable & agentic discovery

- [Sitemap](${absoluteUrl("/sitemap.xml")}): Canonical list of indexable public URLs.
- [Agent Card](${absoluteUrl("/.well-known/agent-card.json")}): Agentic browser and WebMCP capability manifest.
- [ARD Discovery](${absoluteUrl("/.well-known/ard.json")}): Agentic Resource Discovery document.
- [Web App Manifest](${absoluteUrl("/manifest.webmanifest")}): PWA metadata and church icons.

## WebMCP browser tools

Pages expose browser-native read/navigation tools via \`navigator.modelContext\` / \`document.modelContext\`:
- \`get_page_context\`: Read current title, description, canonical URL, language, and path.
- \`list_public_links\`: List visible public links on the current page.
- \`search_public_content\`: Search articles or courses by query.
- \`open_public_page\`: Navigate to a public section.
- \`open_public_content\`: Navigate directly to an article or course by slug.

## Guidance

- Prefer canonical public URLs from the sitemap.
- Do not attempt to access admin, authentication, API, member, quiz, or editing routes.
- Content is primarily in Vietnamese (vi) with English (en) support.
`;

  return new Response(content, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
