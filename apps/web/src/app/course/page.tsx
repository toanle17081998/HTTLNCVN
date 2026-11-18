import type { Metadata } from "next";
import { CoursePage } from "@/components/course/CoursePage";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "Courses",
  "Explore published HTNC learning courses and discipleship resources.",
  "/course",
);

export default function CourseRoute() {
  return <CoursePage />;
}
