import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "@/providers/I18nProvider";
import { useCourseQuery, useLessonQuery } from "@/hooks/course";
import { useArticleQuery } from "@/hooks/article";
import type { TranslationKey } from "@/lib/i18n";
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

const adminPathMap: Partial<Record<string, TranslationKey>> = {
  "/admin": "admin.common.admin",
  "/admin/pages": "admin.nav.pages",
  "/admin/media": "admin.nav.media",
  "/admin/articles": "admin.articles.title",
  "/admin/articles/create": "admin.articles.create",
  "/admin/courses": "admin.courses.title",
  "/admin/courses/create": "admin.courses.create",
  "/admin/lessons/create": "lesson.action.create",
  "/admin/quizzes/create": "admin.quizzes.create",
  "/admin/tests": "admin.tests.title",
  "/admin/church": "nav.church.label",
  "/admin/homepage": "admin.nav.homepage",
  "/admin/households": "admin.nav.households",
  "/admin/navigation": "admin.nav.navigation",
  "/admin/reports": "admin.nav.reports",
  "/admin/serving-schedules/worship": "nav.servingWorship.label",
  "/admin/serving-schedules/cleaning": "nav.servingCleaning.label",
};

export function Breadcrumb({ pathname }: BreadcrumbProps) {
  const { t, localize } = useTranslation();
  const segments = pathname.split("/").filter(Boolean);

  const isAdmin = segments[0] === "admin";
  const isAdminCourse = isAdmin && segments[1] === "courses" &&
    (segments[3] === "edit" || segments[3] === "lessons");
  const courseIndex = isAdminCourse ? 2 : 1;
  const lessonIndex = isAdminCourse ? 4 : 3;
  const isCoursePath = isAdminCourse || segments[0] === "course";
  const isLessonPath = isCoursePath && segments[lessonIndex - 1] === (isAdminCourse ? "lessons" : "lesson");
  const isArticlePath = segments[0] === "article" && segments[1];
  
  const courseSlug = isCoursePath ? segments[courseIndex] : undefined;
  const lessonId = isLessonPath ? segments[lessonIndex] : undefined;
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
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-[var(--text-secondary)]">
        {segments.map((segment, index) => {
          // Skip "lesson" segment if it's just a path separator (e.g. /course/slug/lesson/id)
          if (segment === "lesson" && segments[index + 1]) return null;
          if (isAdminCourse && isLessonPath && index === lessonIndex - 1) return null;

          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          const navItem = navItems.find((item) => item.href === href);
          const navLabelKey = navItem?.labelKey;
          const adminLabelKey = adminPathMap[href];
          
          let label = adminLabelKey
            ? t(adminLabelKey)
            : navLabelKey
              ? t(navLabelKey)
              : toTitle(segment);

          // Dynamic label resolution
          if (courseSlug && index === courseIndex) {
             if (courseQuery.isLoading) label = "...";
             else if (courseQuery.data) {
                label = localize(courseQuery.data, "title");
             }
          } else if (lessonId && index === lessonIndex) {
             if (lessonQuery.isLoading) label = "...";
             else if (lessonQuery.data) {
                label = localize(lessonQuery.data, "title");
             }
          } else if (segment === articleSlug) {
             if (articleQuery.isLoading) label = "...";
             else if (articleQuery.data) {
                label = localize(articleQuery.data, "title");
             }
          }

          let linkHref = !isAdmin || adminLabelKey ? href : undefined;
          if (isAdmin && href === "/admin/serving-schedules") {
            label = t("admin.nav.servingSchedules");
          }
          if (isAdminCourse) {
            if (index === courseIndex && isLessonPath) linkHref = `${href}/edit`;
            if (index === lessonIndex && isLessonPath && segments[index + 1] === "template") {
              linkHref = `${href}/edit`;
            }
            if (isLast && segment === "edit") {
              label = t(isLessonPath ? "admin.lessons.edit" : "admin.courses.edit");
            }
          }

          return (
            <li className="flex items-center gap-2" key={href}>
              {index > 0 ? (
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
                  strokeWidth={1.75}
                />
              ) : null}
              {isLast ? (
                <span aria-current="page" className="font-semibold text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-xs">
                  {label}
                </span>
              ) : linkHref ? (
                <Link
                  className="font-normal transition hover:text-[var(--brand-primary)]"
                  href={linkHref}
                >
                  {label}
                </Link>
              ) : <span>{label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
