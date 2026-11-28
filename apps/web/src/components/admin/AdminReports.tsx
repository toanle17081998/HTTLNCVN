"use client";

import { Text, Button, Card, Pagination, Title } from "@/components/ui";
import { Download, RefreshCw } from "lucide-react";

import { notFound } from "next/navigation";
import { exportMyData } from "@/api/operations";
import { useAuditLogsQuery, useOperationalReportQuery } from "@/hooks/operations";
import { useUrlPagination } from "@/hooks/useUrlPagination";
import { useTranslation } from "@/providers/I18nProvider";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <Text variant="small">{label}</Text>
      <Text as="p" tone="inherit" variant="inherit" className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
        {value}
      </Text>
    </Card>
  );
}

export function AdminReports() {
  const { locale, t } = useTranslation();
  const reportQuery = useOperationalReportQuery();
  const auditQuery = useAuditLogsQuery();
  const report = reportQuery.data;
  const {
    isInvalidParams,
    isPageOutOfRange,
    page: auditPage,
    pageSize: auditPageSize,
    setPage: setAuditPage,
    setPageSize: setAuditPageSize,
  } = useUrlPagination({
    defaultPageSize: 10,
    pageParam: "auditPage",
    pageSizeParam: "auditPageSize",
  });
  const allAuditItems = auditQuery.data?.items ?? [];
  if (isInvalidParams || isPageOutOfRange(allAuditItems.length, auditQuery.isSuccess)) {
    notFound();
  }
  const safeAuditPage = Math.min(auditPage, Math.max(0, Math.ceil(allAuditItems.length / auditPageSize) - 1));
  const pagedAuditItems = allAuditItems.slice(safeAuditPage * auditPageSize, safeAuditPage * auditPageSize + auditPageSize);

  async function downloadPrivacyExport() {
    const data = await exportMyData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "my-htnc-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <Text as="p" tone="inherit" variant="inherit" className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">
            {t("admin.reports.eyebrow")}
          </Text>
          <Title as="h1" className="mt-1" tone="inherit" variant="pagePlain">
            {t("admin.reports.title")}
          </Title>
          <Text as="p" tone="inherit" variant="inherit" className="mt-2 text-[var(--text-secondary)]">
            {t("admin.reports.description")}
          </Text>
        </div>
        <div className="flex w-full flex-wrap justify-end gap-2 md:w-auto">
          <Button onClick={() => { reportQuery.refetch(); auditQuery.refetch(); }} variant="secondary">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("admin.reports.refresh")}
          </Button>
          <Button onClick={downloadPrivacyExport} variant="secondary">
            <Download className="mr-2 h-4 w-4" />
            {t("admin.reports.exportData")}
          </Button>
        </div>
      </div>

      {report ? (
        <>
          <section>
            <Title as="h2" className="mb-4" tone="inherit" variant="card">
              {t("admin.reports.attendance")}
            </Title>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label={t("admin.reports.eventCheckIns")} value={report.attendance.event_check_ins} />
              <Metric label={t("admin.reports.eventParticipants")} value={report.attendance.unique_event_attendees} />
              <Metric label={t("admin.reports.courseCheckIns")} value={report.attendance.course_check_ins} />
              <Metric label={t("admin.reports.courseAttendees")} value={report.attendance.unique_course_attendees} />
            </div>
          </section>
          <section>
            <Title as="h2" className="mb-4" tone="inherit" variant="card">
              {t("admin.reports.courseCompletion")}
            </Title>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label={t("admin.reports.enrollments")} value={report.course_completion.enrolled} />
              <Metric label={t("admin.reports.completed")} value={report.course_completion.completed} />
              <Metric label={t("admin.reports.inProgress")} value={report.course_completion.in_progress} />
              <Metric label={t("admin.reports.completionRate")} value={`${report.course_completion.completion_rate}%`} />
            </div>
          </section>
          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <Title as="h2" tone="inherit" variant="card">
                {t("admin.reports.memberEngagement")}
              </Title>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Metric label={t("admin.reports.activeMembers")} value={report.member_engagement.active_members} />
                <Metric label={t("admin.reports.eventParticipants")} value={report.member_engagement.event_participants} />
                <Metric label={t("admin.reports.completedLessons")} value={report.member_engagement.completed_lessons} />
                <Metric label={t("admin.reports.prayers30Days")} value={report.member_engagement.prayers_last_30_days} />
              </div>
            </Card>
            <Card className="p-6">
              <Title as="h2" tone="inherit" variant="card">
                {t("admin.reports.servingWorkload")}
              </Title>
              <Text className="mt-1" variant="small">
                {t("admin.reports.servingSummary", {
                  assignments: String(report.serving_workload.assignments),
                  members: String(report.serving_workload.serving_members),
                })}
              </Text>
              <div className="mt-4 space-y-2">
                {report.serving_workload.members.map((member) => (
                  <div className="flex justify-between border-b border-[var(--border-subtle)] py-2" key={member.user_id}>
                    <span>{member.name}</span>
                    <strong>{member.assignments}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </>
      ) : (
        <Text as="p" tone="inherit" variant="inherit">
          {reportQuery.isError ? t("admin.reports.error") : t("admin.reports.loading")}
        </Text>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] p-5">
          <Title as="h2" tone="inherit" variant="card">
            {t("admin.reports.recentAudit")}
          </Title>
          <Text variant="small">{t("admin.reports.auditDescription")}</Text>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="p-3">{t("admin.reports.colTime")}</th>
                <th className="p-3">{t("admin.reports.colUser")}</th>
                <th className="p-3">{t("admin.reports.colAction")}</th>
              </tr>
            </thead>
            <tbody>
              {pagedAuditItems.map((item) => (
                <tr className="border-b border-[var(--border-subtle)]" key={item.id}>
                  <td className="p-3">{new Date(item.occurred_at).toLocaleString(locale)}</td>
                  <td className="p-3">{item.user.username}</td>
                  <td className="p-3 font-mono text-xs">{item.event_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {allAuditItems.length > 0 ? (
        <Pagination
          onPageChange={setAuditPage}
          onPageSizeChange={(nextSize) => {
            setAuditPageSize(nextSize);
          }}
          page={safeAuditPage}
          pageSize={auditPageSize}
          total={allAuditItems.length}
        />
      ) : null}
    </div>
  );
}
