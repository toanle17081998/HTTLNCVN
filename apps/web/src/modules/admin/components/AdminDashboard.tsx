"use client";

import Link from "next/link";
import { Activity, CalendarDays, FileText, PenLine, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";

const stats = [
  { hintKey: "admin.dashboard.stat.pagesHint", labelKey: "admin.dashboard.stat.pages", valueKey: "admin.dashboard.stat.pagesValue" },
  { hintKey: "admin.dashboard.stat.postsHint", labelKey: "admin.dashboard.stat.posts", valueKey: "admin.dashboard.stat.postsValue" },
  { hintKey: "admin.dashboard.stat.eventsHint", labelKey: "admin.dashboard.stat.events", valueKey: "admin.dashboard.stat.eventsValue" },
  { hintKey: "admin.dashboard.stat.coursesHint", labelKey: "admin.dashboard.stat.courses", valueKey: "admin.dashboard.stat.coursesValue" },
] as const;

const quickActions = [
  { href: "/admin/pages", labelKey: "admin.dashboard.action.pages", icon: PenLine },
  { href: "/admin/articles/create", labelKey: "admin.dashboard.action.article", icon: FileText },
  { href: "/event", labelKey: "admin.dashboard.action.events", icon: CalendarDays },
] as const;

const activityItems = [
  "admin.dashboard.status.homepage",
  "admin.dashboard.status.reservedPages",
  "admin.dashboard.status.protectedUpdates",
] as const;

export function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">CMS Overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {t("admin.layout.dashboard")}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-[var(--text-secondary)]">
            {t("admin.dashboard.description")}
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--brand-primary)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--brand-primary)]/20 transition hover:brightness-110 active:scale-95"
          href="/admin/pages"
        >
          {t("admin.dashboard.action.pages")}
        </Link>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card className="group relative overflow-hidden rounded-2xl border-[var(--border-subtle)] p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1" key={stat.labelKey}>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[var(--brand-muted)] opacity-20 transition-transform group-hover:scale-150" />
            <p className="relative text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{t(stat.labelKey)}</p>
            <p className="relative mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)]">{t(stat.valueKey)}</p>
            <p className="relative mt-2 text-sm font-medium text-[var(--text-secondary)]">{t(stat.hintKey)}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <Card className="rounded-2xl border-[var(--border-subtle)] p-6 shadow-sm lg:col-span-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("admin.dashboard.quickActions")}</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  className="group flex min-h-32 flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-all duration-200 hover:border-[var(--brand-primary)] hover:shadow-md hover:shadow-[var(--brand-primary)]/5"
                  href={action.href}
                  key={action.href}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-muted)] text-[var(--brand-primary)] transition-colors group-hover:bg-[var(--brand-primary)] group-hover:text-white">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{t(action.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-2xl border-[var(--border-subtle)] p-6 shadow-sm lg:col-span-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Activity aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("admin.dashboard.siteStatus")}</h2>
          </div>
          <div className="mt-6 space-y-3">
            {activityItems.map((item) => (
              <div 
                className="flex gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-sm leading-relaxed text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--bg-surface)]" 
                key={item}
              >
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-primary)]" />
                {t(item)}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
