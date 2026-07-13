import { QuizAttemptPage } from "@/components/course/QuizAttemptPage";

type QuizAttemptRouteProps = {
  params: Promise<{ attemptId: string }>;
};

export default async function QuizAttemptRoute({ params }: QuizAttemptRouteProps) {
  const { attemptId } = await params;
  return <QuizAttemptPage attemptId={attemptId} />;
}
