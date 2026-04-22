import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "@/providers/I18nProvider";
import { useCourseQuery, useLessonQuery } from "@services/course";
import { navItems } from "./navigation";

type BreadcrumbProps = {
  pathname: string;
};

function toTitle(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Breadcrumb({ pathname }: BreadcrumbProps) {
  const { t } = useTranslation();
  const segments = pathname.split("/").filter(Boolean);

  // Extract params if we are in a course or lesson page
  const isCoursePath = segments[0] === "course" && segments[1];
  const isLessonPath = isCoursePath && segments[2] === "lesson" && segments[3];
  
  const courseSlug = isCoursePath ? segments[1] : undefined;
  const lessonId = isLessonPath ? segments[3] : undefined;

  const courseQuery = useCourseQuery(courseSlug);
  const lessonQuery = useLessonQuery(courseSlug, lessonId);

  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="text-base">
        <span className="font-semibold text-[var(--text-primary)]">
          {t("breadcrumb.dashboard")}
        </span>
      </nav>
    );
  }

  // Filter segments: skip "lesson" literal if it's followed by an ID
  const filteredSegments = segments.filter((segment, index) => {
    if (segment === "lesson" && segments[index + 1]) return false;
    return true;
  });

  return (
    <nav aria-label="Breadcrumb" className="text-base">
      <ol className="flex min-w-0 flex-wrap items-center gap-2 text-[var(--text-secondary)]">
        <li>
          <Link
            className="font-normal transition hover:text-[var(--brand-primary)]"
            href="/"
          >
            {t("breadcrumb.dashboard")}
          </Link>
        </li>
        {segments.map((segment, index) => {
          // Skip "lesson" segment if it's just a path separator
          if (segment === "lesson" && segments[index + 1]) return null;

          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const navLabelKey = navItems.find(
            (item) => item.href === href,
          )?.labelKey;
          
          let label = navLabelKey ? t(navLabelKey) : toTitle(segment);

          // Custom labels for course and lesson
          if (segment === courseSlug && courseQuery.data) {
            label = courseQuery.data.title_vi || courseQuery.data.title_en;
          } else if (segment === lessonId && lessonQuery.data) {
            label = lessonQuery.data.title_vi || lessonQuery.data.title_en;
          }

          const isLast = index === segments.length - 1;

          return (
            <li className="flex items-center gap-2" key={href}>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
                strokeWidth={1.75}
              />
              {isLast ? (
                <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-xs">
                  {label}
                </span>
              ) : (
                <Link
                  className="font-normal transition hover:text-[var(--brand-primary)]"
                  href={href}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
