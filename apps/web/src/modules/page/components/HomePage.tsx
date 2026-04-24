"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Card, cn } from "@/components/ui";
import {
  homepageMockData,
  type HomepageEvent,
} from "@/mockData";
import { useTranslation } from "@/providers/I18nProvider";
import { usePageQuery } from "@services/page";
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
    <Card className="overflow-hidden flex flex-col">
      {article.cover_image_url ? (
        <div
          className="h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${article.cover_image_url})` }}
        />
      ) : (
        <div className="h-40 bg-[var(--brand-muted)] flex items-center justify-center">
          <span className="text-[var(--brand-primary)] font-bold text-2xl opacity-20">HTNC</span>
        </div>
      )}
      <div className="grid gap-4 p-5 flex-1">
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
          <h3 className="text-lg font-semibold leading-6 text-[var(--text-primary)] line-clamp-2">
            {locale === "vi" ? (article.title_vi || article.title_en) : (article.title_en || article.title_vi)}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">
            {locale === "vi" ? article.title_en : ""}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4 text-sm">
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

function ListSlideshow<T>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoSlideIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoSlide = () => {
    stopAutoSlide();
    autoSlideIntervalRef.current = setInterval(() => {
      setActiveIndex((current) => (items.length > 0 ? (current + 1) % items.length : 0));
    }, 5000);
  };

  const stopAutoSlide = () => {
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current);
    }
  };

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, [items.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    stopAutoSlide();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      startAutoSlide();
      return;
    }
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setActiveIndex((current) => (items.length > 0 ? (current + 1) % items.length : 0));
    } else if (isRightSwipe) {
      setActiveIndex((current) => (items.length > 0 ? (current - 1 + items.length) % items.length : 0));
    }
    
    startAutoSlide();
  };

  return (
    <div className="grid gap-6 lg:hidden">
      <div 
        className="relative overflow-hidden touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {items.map((item, i) => (
            <div className="w-full shrink-0 px-2" key={i}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-2.5">
        {items.map((_, i) => (
          <button
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-2.5 rounded-full transition-all duration-300",
              activeIndex === i
                ? "w-8 bg-[var(--brand-primary)]"
                : "w-2.5 bg-[var(--border-strong)] opacity-40 hover:opacity-100",
            )}
            key={i}
            onClick={() => {
              stopAutoSlide();
              setActiveIndex(i);
              startAutoSlide();
            }}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

export function HomePage() {
  const { t, locale } = useTranslation();
  const articlesQuery = useArticlesQuery({ take: 3, status: "published" });
  const coursesQuery = useCoursesQuery({ take: 3, status: "published" });
  const { data: pageData } = usePageQuery("home");

  const { events } = homepageMockData;
  const [featuredEvent, ...secondaryEvents] = events;
  const allEvents = [featuredEvent, ...secondaryEvents].filter(Boolean) as HomepageEvent[];

  const stats = [
    { label: t("home.stats.courses"), value: "12" },
    { label: t("home.stats.lectures"), value: "28" },
    { label: t("home.stats.gatherings"), value: "6" },
  ];

  const heroContent = {
    eyebrow: t("home.hero.eyebrow"),
    headline: locale === "vi" 
      ? (pageData?.title_vi || t("home.hero.headline"))
      : (pageData?.title_en || t("home.hero.headline")),
    subheadline: t("home.hero.subheadline"),
    image: pageData?.cover_image_url || "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1400&q=80"
  };

  return (
    <div className="flex flex-col gap-12 lg:gap-20 pb-16">
      {/* Full-Width Hero Section */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 sm:-mt-10 lg:-mt-12 relative flex min-h-[22rem] items-center overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm sm:min-h-[28rem]">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
          style={{ backgroundImage: `url(${heroContent.image})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, var(--hero-scrim-from) 0%, var(--hero-scrim-mid) 52%, transparent 100%)",
          }}
        />
        
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="flex w-full flex-col justify-center gap-6 py-12 lg:max-w-4xl lg:px-4">
            <div className="space-y-3">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-[var(--brand-primary)] drop-shadow-sm">
                {heroContent.eyebrow}
              </p>
              <h1 className="text-3xl font-black leading-[1.1] tracking-tight text-[var(--text-inverse)] sm:text-5xl lg:text-7xl">
                {heroContent.headline}
              </h1>
              <p className="max-w-xl text-sm font-medium leading-relaxed text-[var(--text-inverse-muted)] sm:text-lg">
                {heroContent.subheadline}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--brand-primary)] px-6 text-sm font-bold text-[var(--text-inverse)] shadow-lg transition-all hover:bg-[var(--brand-primary-strong)] active:scale-95 sm:h-12 sm:px-8 sm:text-base"
                href="/course"
              >
                {t("home.hero.cta")}
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-xl border-2 px-6 text-sm font-bold text-[var(--text-inverse)] shadow-xl backdrop-blur-md transition-all active:scale-95 sm:h-12 sm:px-8 sm:text-base"
                href="/event"
                style={{
                  backgroundColor: "var(--hero-secondary-bg)",
                  borderColor: "var(--hero-panel-border)",
                }}
              >
                {t("home.hero.secondaryCta")}
              </Link>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-6 mt-2 max-w-2xl">
              {stats.map((stat) => (
                <div
                  className="rounded-xl border px-3 py-2 backdrop-blur-md transition-all sm:px-6 sm:py-4"
                  key={stat.label}
                  style={{
                    backgroundColor: "var(--hero-panel)",
                    borderColor: "var(--hero-panel-border)",
                  }}
                >
                  <p className="text-xl font-black text-[var(--text-inverse)] sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.2em] text-[var(--text-inverse-muted)] sm:text-[10px]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Constrained Content Sections */}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 space-y-12 lg:gap-20">
        <section className="grid gap-6 rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-6 sm:px-6 sm:py-8">
          <SectionHeader
            action={{ href: "/article", label: t("nav.article.label") }}
            eyebrow={t("page.article.eyebrow")}
            title={t("page.article.title")}
          />
          {articlesQuery.isLoading ? (
            <div className="grid gap-6 lg:grid-cols-3">
               {[1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse bg-[var(--bg-base)] rounded-2xl" />)}
            </div>
          ) : (
            <>
              <ListSlideshow 
                items={articlesQuery.data?.items ?? []} 
                renderItem={(article) => <ArticleCard article={article} />} 
              />
              <div className="hidden grid-cols-3 gap-6 lg:grid">
                {articlesQuery.data?.items.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </>
          )}
        </section>

        <section className="grid gap-6 rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-6 sm:px-6 sm:py-8">
          <SectionHeader
            action={{ href: "/event", label: t("event.calendar.view") }}
            eyebrow={t("page.event.eyebrow")}
            title={t("page.event.title")}
          />
          <ListSlideshow 
            items={allEvents} 
            renderItem={(event) => <EventCard event={event} featured={event.id === featuredEvent?.id} />} 
          />
          <div className="hidden grid-cols-2 gap-6 lg:grid">
            {featuredEvent ? (
              <EventCard event={featuredEvent} featured />
            ) : null}
            <div className="grid gap-6">
              {secondaryEvents.map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-6 sm:px-6 sm:py-8">
          <SectionHeader
            action={{ href: "/course", label: t("nav.course.label") }}
            eyebrow={t("nav.course.label")}
            title={t("page.course.title")}
          />
          {coursesQuery.isLoading ? (
            <div className="grid gap-6 lg:grid-cols-3">
               {[1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse bg-[var(--bg-base)] rounded-2xl" />)}
            </div>
          ) : (
            <>
              <ListSlideshow 
                items={coursesQuery.data?.items ?? []} 
                renderItem={(course) => <CourseCard course={course} />} 
              />
              <div className="hidden grid-cols-3 gap-6 lg:grid">
                {coursesQuery.data?.items.map((course) => (
                  <CourseCard course={course} key={course.id} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
