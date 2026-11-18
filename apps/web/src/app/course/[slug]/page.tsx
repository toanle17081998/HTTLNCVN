import { Metadata } from "next";
import { CourseDetailPage } from "@/components/course/CourseDetailPage";
import { courseApi } from "@/services/course";
import { getLocalizedField } from "@/lib/i18n";

type CourseDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CourseDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const course = await courseApi.detail(slug);
    return {
      title: `${getLocalizedField(course, "title")} | HTNC`,
      description: getLocalizedField(course, "summary") || undefined,
      openGraph: {
        title: getLocalizedField(course, "title"),
        description: getLocalizedField(course, "summary") || undefined,
        images: course.cover_image_url ? [course.cover_image_url] : [],
        type: "website",
      },
    };
  } catch {
    return {
      title: "Course | HTNC",
    };
  }
}

export default async function CourseDetailRoute({ params }: CourseDetailRouteProps) {
  const { slug } = await params;
  return <CourseDetailPage slug={slug} />;
}
