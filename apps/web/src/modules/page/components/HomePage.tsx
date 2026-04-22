"use client";

import Link from "next/link";
import { Card, cn } from "@/components/ui";
import {
  homepageMockData,
  type HomepageEvent,
} from "@/mockData";
import { useTranslation } from "@/providers/I18nProvider";
import { useArticlesQuery, type ArticleListItem } from "@services/article";
import { useCoursesQuery, type CourseListItem } from "@services/course";

function formatDateTime(value: string, locale: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatCourseDuration(minutes: number, t: (key: string) => string) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) {
    return `${remainingMinutes} ${t("common.unit.minute")}`;
  }

  if (!remainingMinutes) {
    return `${hours} ${t("common.unit.hour")}`;
  }

  return `${hours} ${t("common.unit.hour")} ${remainingMinutes} ${t("common.unit.minute")}`;
}

function SectionHeader({
  action,
  eyebrow,
  title,
}: {
  action?: {
    href: string;
    label: string;
  };
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary)]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-muted)]"
          href={action.href}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function ArticleCard({ article }: { article: ArticleListItem }) {
  const { t, locale } = useTranslation();
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-xs font-semibold uppercase text-[var(--brand-primary)]">
          {article.category?.name || t("nav.article.label")}
        </span>
        {article.published_at ? (
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {formatDateTime(article.published_at, locale)}
          </span>
        ) : null}
      </div>
      <div>
        <h3 className="mt-1 text-lg font-semibold leading-6 text-[var(--text-primary)]">
          {locale === "vi" ? (article.title_vi || article.title_en) : (article.title_en || article.title_vi)}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">
          {locale === "vi" ? (article.title_en) : ""}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4 text-sm">
        <span className="font-medium text-[var(--text-primary)]">
          {article.creator.username}
        </span>
        <Link
          href={`/article/${encodeURIComponent(article.slug)}`}
          className="text-[var(--brand-primary)] font-semibold hover:underline"
        >
          {t("action.readMore")}
        </Link>
      </div>
    </Card>
  );
}

function EventCard({
  event,
  featured = false,
}: {
  event: HomepageEvent;
  featured?: boolean;
}) {
  const { t, locale } = useTranslation();
  return (
    <Card className={cn("overflow-hidden", featured && "lg:row-span-2")}>
      {event.cover_image_url ? (
        <div
          className={cn(
            "bg-cover bg-center",
            featured ? "h-56" : "h-36",
          )}
          style={{ backgroundImage: `url(${event.cover_image_url})` }}
        />
      ) : null}
      <div className="grid gap-4 p-5">
        <div>
          <p className="text-sm font-semibold text-[var(--brand-primary)]">
            {formatDateTime(event.starts_at, locale)}
          </p>
          <h3 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
            {event.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {event.excerpt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-md border border-[var(--border-subtle)] px-2.5 py-1 text-[var(--text-secondary)]">
            {event.is_online ? t("event.location.online") : event.location_name}
          </span>
          <span className="rounded-md border border-[var(--border-subtle)] px-2.5 py-1 text-[var(--text-secondary)]">
            {event.organizer.name}
          </span>
        </div>
      </div>
    </Card>
  );
}

function CourseCard({ course }: { course: CourseListItem }) {
  const { t, locale } = useTranslation();
  return (
    <Card className="overflow-hidden flex flex-col">
      {course.cover_image_url ? (
        <div
          className="h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${course.cover_image_url})` }}
        />
      ) : (
        <div className="h-40 bg-[var(--brand-muted)] flex items-center justify-center">
           <span className="text-[var(--brand-primary)] font-bold text-2xl opacity-20">HTNC</span>
        </div>
      )}
      <div className="grid gap-4 p-5 flex-1">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-[var(--brand-primary)]">
            {t(`course.form.level.${course.level}` as any)}
          </span>
          <span className="rounded-md border border-[var(--border-subtle)] px-2.5 py-1 text-[var(--text-secondary)]">
            {course.lesson_count} {t("course.form.lessons")}
          </span>
        </div>
        <div>
          <h3 className="text-xl font-semibold leading-7 text-[var(--text-primary)] line-clamp-2">
            {locale === "vi" ? (course.title_vi || course.title_en) : (course.title_en || course.title_vi)}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">
            {course.summary}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4 text-sm">
          <span className="font-medium text-[var(--text-primary)]">
            {course.creator?.username || "HTNC"}
          </span>
          <Link
            href={`/course/${encodeURIComponent(course.slug)}`}
            className="text-[var(--brand-primary)] font-semibold hover:underline"
          >
            {t("action.readMore")}
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const articlesQuery = useArticlesQuery({ take: 3, status: "published" });
  const coursesQuery = useCoursesQuery({ take: 3, status: "published" });

  const { events } = homepageMockData;
  const [featuredEvent, ...secondaryEvents] = events;

  const stats = [
    { label: t("home.stats.courses"), value: "12" },
    { label: t("home.stats.lectures"), value: "28" },
    { label: t("home.stats.gatherings"), value: "6" },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8">
      <section className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm">
        <div className="grid min-h-[28rem] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center gap-7 px-6 py-10 sm:px-8 lg:px-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-primary)]">
                {t("home.hero.eyebrow")}
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
                {t("home.hero.headline")}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                {t("home.hero.subheadline")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md border border-transparent bg-[var(--btn-primary-bg)] px-5 text-base font-semibold text-[var(--btn-primary-text)] shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                href="/course"
              >
                {t("home.hero.cta")}
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 text-base font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                href="/event"
              >
                {t("home.hero.secondaryCta")}
              </Link>
            </div>
            <Link
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
              href="/about"
            >
              <span className="block font-semibold text-[var(--text-primary)]">
                {t("home.about.title")}
              </span>
              <span>
                {t("home.about.description")}
              </span>
            </Link>
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  className="rounded-md border border-[var(--border-subtle)] px-4 py-3"
                  key={stat.label}
                >
                  <p className="text-2xl font-semibold text-[var(--text-primary)]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-72 bg-[var(--brand-muted)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1400&q=80)",
              }}
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <SectionHeader
          action={{ href: "/article", label: t("nav.article.label") }}
          eyebrow={t("page.article.eyebrow")}
          title={t("page.article.title")}
        />
        {articlesQuery.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
             {[1, 2, 3].map(i => <Card key={i} className="h-48 animate-pulse bg-[var(--bg-base)]" />)}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {articlesQuery.data?.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <SectionHeader
          action={{ href: "/event", label: t("event.calendar.view") }}
          eyebrow={t("page.event.eyebrow")}
          title={t("page.event.title")}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {featuredEvent ? (
            <EventCard event={featuredEvent} featured />
          ) : null}
          <div className="grid gap-4">
            {secondaryEvents.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <SectionHeader
          action={{ href: "/course", label: t("nav.course.label") }}
          eyebrow={t("nav.course.label")}
          title={t("page.course.title")}
        />
        {coursesQuery.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
             {[1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse bg-[var(--bg-base)]" />)}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {coursesQuery.data?.items.map((course) => (
              <CourseCard course={course} key={course.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
