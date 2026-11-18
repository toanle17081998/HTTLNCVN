import { Metadata } from "next";
import { CourseDetailPage } from "@/components/course/CourseDetailPage";
import { courseApi } from "@/api/course";
import { getLocalizedField } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

type CourseDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CourseDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const course = await courseApi.detail(slug);
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
  } catch {
    return {
      title: "Course",
      robots: { index: false },
    };
  }
}

export default async function CourseDetailRoute({ params }: CourseDetailRouteProps) {
  const { slug } = await params;
  const course = await courseApi.detail(slug).catch(() => null);
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
      <CourseDetailPage slug={slug} />
    </>
  );
}
