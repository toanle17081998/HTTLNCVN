import type { Metadata } from "next";
import { CoursePage } from "@/components/course/CoursePage";
import { getServerLocale } from "@/lib/server-locale";
import { createBilingualPageMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return createBilingualPageMetadata(
    {
      vi: {
        title: "Khóa học",
        description: "Khám phá các khóa học Kinh Thánh và môn đồ hóa của Hội Thánh Tin Lành Nhân Cấp (HTTLNC).",
      },
      en: {
        title: "Courses",
        description: "Explore Bible courses and discipleship resources from Multiplying Evangelical Church (MEC).",
      },
    },
    "/course",
    locale,
  );
}

export default function CourseRoute() {
  return <CoursePage />;
}
