import { cache } from "react";
import { Metadata } from "next";
import { CourseDetailPage } from "@/components/course/CourseDetailPage";
import { courseApi } from "@/api/course";
import { getLocalizedField } from "@/lib/i18n";
import { absoluteUrl, getSiteName, getSiteShortName } from "@/lib/site";
import { getServerLocale } from "@/lib/server-locale";

type CourseDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

const getCourseBySlug = cache((slug: string) => courseApi.detail(slug).catch(() => null));

export async function generateMetadata({ params }: CourseDetailRouteProps): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getServerLocale()]);
  const course = await getCourseBySlug(slug);
  if (!course) {
    return {
      title: locale === "en" ? "Course" : "Khóa học",
      robots: { index: false },
    };
  }
  const title = getLocalizedField(course, "title", locale);
  const description = getLocalizedField(course, "summary", locale) || title;
  const image = course.cover_image_url || "/church-logo.webp";
  const path = `/course/${encodeURIComponent(course.slug)}`;
  return {
    title,
    description,
    alternates: { canonical: path, languages: { vi: path, en: path, "x-default": path } },
    openGraph: {
      title,
      description,
      locale: locale === "en" ? "en_US" : "vi_VN",
      alternateLocale: [locale === "en" ? "vi_VN" : "en_US"],
      images: [image],
      type: "website",
      url: path,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function CourseDetailRoute({ params }: CourseDetailRouteProps) {
  const [{ slug }, locale] = await Promise.all([params, getServerLocale()]);
  const course = await getCourseBySlug(slug);
  const courseUrl = course ? absoluteUrl(`/course/${encodeURIComponent(course.slug)}`) : null;
  const title = course ? getLocalizedField(course, "title", locale) : "";
  const courseJsonLd =
    course && courseUrl
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Course",
              name: title,
              description: getLocalizedField(course, "summary", locale),
              inLanguage: locale,
              url: courseUrl,
              image: course.cover_image_url || absoluteUrl("/church-logo.webp"),
              provider: {
                "@type": "Organization",
                name: getSiteName(locale),
                url: absoluteUrl("/"),
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: getSiteShortName(locale), item: absoluteUrl("/") },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: locale === "en" ? "Courses" : "Khóa học",
                  item: absoluteUrl("/course"),
                },
                { "@type": "ListItem", position: 3, name: title, item: courseUrl },
              ],
            },
          ],
        }
      : null;

  return (
    <>
      {courseJsonLd ? (
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd).replace(/</g, "\\u003c") }}
          type="application/ld+json"
        />
      ) : null}
      <CourseDetailPage initialCourse={course} slug={slug} />
    </>
  );
}
