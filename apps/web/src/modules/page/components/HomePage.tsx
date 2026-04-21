"use client";

import { PageLayout, navItems } from "@/components/layout";
import { Button, Card, FormField, Input, Select, Textarea } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";

export function HomePage() {
  const { t } = useTranslation();

  return (
    <PageLayout
      actions={
        <>
          <Button variant="secondary">{t("action.inviteMember")}</Button>
          <Button>{t("action.createCourse")}</Button>
        </>
      }
      description={t("home.description")}
      eyebrow={t("home.eyebrow")}
      title={t("home.title")}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          [t("home.metric.activeModules"), "8"],
          [t("home.metric.draftUpdates"), "12"],
          [t("home.metric.pendingReviews"), "4"],
        ].map(([label, value]) => (
          <Card className="p-5" key={label}>
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              {value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t("home.modules")}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {navItems.slice(1).map((item) => (
              <div
                className="rounded-md border border-[var(--border-subtle)] px-4 py-3"
                key={item.href}
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {t(item.labelKey)}
                </p>
                <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                  {t(item.descriptionKey)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t("home.sharedControls")}
          </h2>
          <form className="mt-4 grid gap-4">
            <FormField htmlFor="title" label={t("form.title")}>
              <Input id="title" placeholder={t("form.titlePlaceholder")} />
            </FormField>
            <FormField htmlFor="module" label={t("form.module")}>
              <Select id="module" defaultValue="course">
                <option value="course">{t("nav.course.label")}</option>
                <option value="blog">{t("nav.blog.label")}</option>
                <option value="event">{t("nav.event.label")}</option>
              </Select>
            </FormField>
            <FormField htmlFor="note" label={t("form.note")}>
              <Textarea id="note" placeholder={t("form.notePlaceholder")} rows={3} />
            </FormField>
            <Button type="submit">{t("action.saveDraft")}</Button>
          </form>
        </Card>
      </div>
    </PageLayout>
  );
}
