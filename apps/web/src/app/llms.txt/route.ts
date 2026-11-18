import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export function GET() {
  const content = `# HTNC Platform

> HTNC is a bilingual church learning and community platform with public articles, courses, events, and church information.

## Public sections

- [Home](${absoluteUrl("/")}): Current church highlights and featured content.
- [Articles](${absoluteUrl("/article")}): Published articles and announcements.
- [Courses](${absoluteUrl("/course")}): Published learning courses.
- [Events](${absoluteUrl("/event")}): Public event information.
- [About](${absoluteUrl("/about")}): Information about HTNC.
- [Contact](${absoluteUrl("/contact")}): Public contact information.
- [Sitemap](${absoluteUrl("/sitemap.xml")}): Discoverable public URLs.

## Guidance

- Prefer canonical public URLs from the sitemap.
- Do not attempt to access admin, authentication, member, quiz, or editing routes.
- Page content may be available in Vietnamese and English.
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
