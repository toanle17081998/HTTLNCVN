import { Metadata } from "next";
import { CourseDetailPage } from "@/modules/course/components/CourseDetailPage";
import { courseApi } from "@services/course";

type CourseDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CourseDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const course = await courseApi.detail(slug);
    return {
      title: `${course.title_vi || course.title_en} | HTNC`,
      description: course.summary_vi ?? course.summary_en ?? undefined,
      openGraph: {
        title: course.title_vi || course.title_en,
        description: course.summary_vi ?? course.summary_en ?? undefined,
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
