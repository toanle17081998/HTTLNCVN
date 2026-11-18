import { apiRequest } from "./client";
import type { Course } from "@/services/course";

export const courseApi = {
  detail(slug: string) {
    return apiRequest<Course>(`/courses/${encodeURIComponent(slug)}`);
  },
};
