import { LessonDetailPage } from "@/modules/course/components/LessonDetailPage";

type LessonDetailRouteProps = {
  params: Promise<{ lessonId: string; slug: string }>;
};

export default async function LessonDetailRoute({ params }: LessonDetailRouteProps) {
  const { lessonId, slug } = await params;
  return <LessonDetailPage courseSlug={slug} lessonId={lessonId} />;
}
