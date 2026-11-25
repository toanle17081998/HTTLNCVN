import { cache } from "react";
import { Metadata } from "next";
import { CourseDetailPage } from "@/components/course/CourseDetailPage";
import { courseApi } from "@/api/course";
import { getLocalizedField } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

type CourseDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

const getCourseBySlug = cache((slug: string) => courseApi.detail(slug).catch(() => null));

export async function generateMetadata({ params }: CourseDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) {
    return {
      title: "Course",
      robots: { index: false },
    };
  }
  const title = getLocalizedField(course, "title");
  const description = getLocalizedField(course, "summary") || title;
  return {
    title,
    description,
    alternates: { canonical: `/course/${encodeURIComponent(course.slug)}` },
    openGraph: {
      title,
      description,
      images: course.cover_image_url ? [course.cover_image_url] : [],
      type: "website",
      url: `/course/${encodeURIComponent(course.slug)}`,
    },
    twitter: { title, description, images: course.cover_image_url ? [course.cover_image_url] : [] },
  };
}

export default async function CourseDetailRoute({ params }: CourseDetailRouteProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  const courseJsonLd = course ? {
    "@context": "https://schema.org",
    "@type": "Course",
    name: getLocalizedField(course, "title"),
    description: getLocalizedField(course, "summary"),
    url: absoluteUrl(`/course/${encodeURIComponent(course.slug)}`),
    image: course.cover_image_url || undefined,
    provider: {
      "@type": "Organization",
      name: "HTNC Platform",
      url: absoluteUrl("/"),
    },
  } : null;

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
