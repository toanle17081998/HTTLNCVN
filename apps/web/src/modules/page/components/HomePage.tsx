"use client";

import Link from "next/link";
import { Card, cn } from "@/components/ui";
import {
  homepageMockData,
  type HomepageCourse,
  type HomepageEvent,
  type HomepageLecture,
} from "@/mockData";

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatDateTime(value: string) {
  const date = new Date(value);
  const month = monthLabels[date.getUTCMonth()];
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, "0");

  return `${month} ${day}, ${displayHour}:${displayMinute} ${suffix}`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));

  return `${minutes} min`;
}

function formatCourseDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) {
    return `${remainingMinutes} min`;
  }

  if (!remainingMinutes) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function levelLabel(level: HomepageCourse["level"]) {
  return level[0].toUpperCase() + level.slice(1);
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

function LectureCard({ lecture }: { lecture: HomepageLecture }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-xs font-semibold uppercase text-[var(--brand-primary)]">
          {lecture.lesson_type}
        </span>
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          {formatDuration(lecture.duration_seconds)}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {lecture.course.title}
        </p>
        <h3 className="mt-1 text-lg font-semibold leading-6 text-[var(--text-primary)]">
          {lecture.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {lecture.short_description}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4 text-sm">
        <span className="font-medium text-[var(--text-primary)]">
          {lecture.instructor.name}
        </span>
        <span className="text-[var(--text-secondary)]">
          {formatDateTime(lecture.published_at)}
        </span>
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
            {formatDateTime(event.starts_at)}
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
            {event.is_online ? "Online" : event.location_name}
          </span>
          <span className="rounded-md border border-[var(--border-subtle)] px-2.5 py-1 text-[var(--text-secondary)]">
            {event.organizer.name}
          </span>
        </div>
      </div>
    </Card>
  );
}

function CourseCard({ course }: { course: HomepageCourse }) {
  return (
    <Card className="overflow-hidden">
      {course.cover_image_url ? (
        <div
          className="h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${course.cover_image_url})` }}
        />
      ) : null}
      <div className="grid gap-4 p-5">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-[var(--brand-primary)]">
            {levelLabel(course.level)}
          </span>
          <span className="rounded-md border border-[var(--border-subtle)] px-2.5 py-1 text-[var(--text-secondary)]">
            {course.lesson_count} lessons
          </span>
        </div>
        <div>
          <h3 className="text-xl font-semibold leading-7 text-[var(--text-primary)]">
            {course.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {course.summary}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4 text-sm">
          <span className="font-medium text-[var(--text-primary)]">
            {course.instructor.name}
          </span>
          <span className="text-[var(--text-secondary)]">
            {formatCourseDuration(course.estimated_duration_minutes)}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function HomePage() {
  const { hero, newLectures, events, featuredCourses } = homepageMockData;
  const [featuredEvent, ...secondaryEvents] = events;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8">
      <section className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm">
        <div className="grid min-h-[28rem] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center gap-7 px-6 py-10 sm:px-8 lg:px-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-primary)]">
                {hero.eyebrow}
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
                {hero.headline}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                {hero.subheadline}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md border border-transparent bg-[var(--btn-primary-bg)] px-5 text-base font-semibold text-[var(--btn-primary-text)] shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                href={hero.cta.href}
              >
                {hero.cta.label}
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 text-base font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                href={hero.secondaryCta.href}
              >
                {hero.secondaryCta.label}
              </Link>
            </div>
            <Link
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
              href="/about"
            >
              <span className="block font-semibold text-[var(--text-primary)]">
                About HTNC
              </span>
              <span>
                Read the public article about our learning focus, community, and
                why this platform exists.
              </span>
            </Link>
            <div className="grid gap-3 sm:grid-cols-3">
              {hero.stats.map((stat) => (
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
          action={{ href: "/course", label: "Browse lessons" }}
          eyebrow="New lectures"
          title="Recently published learning"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {newLectures.map((lecture) => (
            <LectureCard key={lecture.id} lecture={lecture} />
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <SectionHeader
          action={{ href: "/event", label: "See calendar" }}
          eyebrow="Events"
          title="Upcoming gatherings"
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
          action={{ href: "/course", label: "View all courses" }}
          eyebrow="Featured courses"
          title="Start a guided path"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {featuredCourses.map((course) => (
            <CourseCard course={course} key={course.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
