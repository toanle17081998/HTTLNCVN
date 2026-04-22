import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "@/providers/I18nProvider";
import { useCourseQuery, useLessonQuery } from "@services/course";
import { useArticleQuery } from "@services/article";
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
  const { t, locale } = useTranslation();
  const segments = pathname.split("/").filter(Boolean);

  // Extract params for dynamic labels
  const isCoursePath = segments[0] === "course" && segments[1];
  const isLessonPath = isCoursePath && segments[2] === "lesson" && segments[3];
  const isArticlePath = segments[0] === "article" && segments[1];
  
  const courseSlug = isCoursePath ? segments[1] : undefined;
  const lessonId = isLessonPath ? segments[3] : undefined;
  const articleSlug = isArticlePath ? segments[1] : undefined;

  const courseQuery = useCourseQuery(courseSlug);
  const lessonQuery = useLessonQuery(courseSlug, lessonId);
  const articleQuery = useArticleQuery(articleSlug);

  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="text-base">
        <span className="font-semibold text-[var(--text-primary)]">
          {t("breadcrumb.dashboard")}
        </span>
      </nav>
    );
  }

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
          // Skip "lesson" segment if it's just a path separator (e.g. /course/slug/lesson/id)
          if (segment === "lesson" && segments[index + 1]) return null;

          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const navItem = navItems.find((item) => item.href === href);
          const navLabelKey = navItem?.labelKey;
          
          let label = navLabelKey ? t(navLabelKey) : toTitle(segment);

          // Dynamic label resolution
          if (segment === courseSlug) {
             if (courseQuery.isLoading) label = "...";
             else if (courseQuery.data) {
                label = locale === 'vi' ? (courseQuery.data.title_vi || courseQuery.data.title_en) : (courseQuery.data.title_en || courseQuery.data.title_vi);
             }
          } else if (segment === lessonId) {
             if (lessonQuery.isLoading) label = "...";
             else if (lessonQuery.data) {
                label = locale === 'vi' ? (lessonQuery.data.title_vi || lessonQuery.data.title_en) : (lessonQuery.data.title_en || lessonQuery.data.title_vi);
             }
          } else if (segment === articleSlug) {
             if (articleQuery.isLoading) label = "...";
             else if (articleQuery.data) {
                label = locale === 'vi' ? (articleQuery.data.title_vi || articleQuery.data.title_en) : (articleQuery.data.title_en || articleQuery.data.title_vi);
             }
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
