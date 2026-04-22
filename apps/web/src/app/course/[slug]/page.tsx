import { CourseDetailPage } from "@/modules/course/components/CourseDetailPage";

type CourseDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function CourseDetailRoute({ params }: CourseDetailRouteProps) {
  const { slug } = await params;
  return <CourseDetailPage slug={slug} />;
}
