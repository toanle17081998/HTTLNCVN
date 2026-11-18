"use client";

import { Text, Button, Card, Title } from "@/components/ui";
import { Download, RefreshCw } from "lucide-react";

import { exportMyData } from "@/api/operations";
import { useAuditLogsQuery, useOperationalReportQuery } from "@/hooks/operations";

function Metric({ label, value }: { label: string; value: string | number }) {
  return <Card className="p-5"><Text variant="small">{label}</Text><Text as="p" tone="inherit" variant="inherit" className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{value}</Text></Card>;
}

export function AdminReports() {
  const reportQuery = useOperationalReportQuery();
  const auditQuery = useAuditLogsQuery();
  const report = reportQuery.data;

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><Text as="p" tone="inherit" variant="inherit" className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">Operations</Text><Title as="h1" className="mt-1" tone="inherit" variant="pagePlain">Reports and audit</Title><Text as="p" tone="inherit" variant="inherit" className="mt-2 text-[var(--text-secondary)]">Attendance, learning, serving, engagement, and recent administrative activity.</Text></div>
        <div className="flex gap-2"><Button onClick={() => { reportQuery.refetch(); auditQuery.refetch(); }} variant="secondary"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button onClick={downloadPrivacyExport} variant="secondary"><Download className="mr-2 h-4 w-4" />Export my data</Button></div>
      </div>

      {report ? <>
        <section><Title as="h2" className="mb-4" tone="inherit" variant="card">Attendance</Title><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Event check-ins" value={report.attendance.event_check_ins} /><Metric label="Event participants" value={report.attendance.unique_event_attendees} /><Metric label="Course check-ins" value={report.attendance.course_check_ins} /><Metric label="Course attendees" value={report.attendance.unique_course_attendees} /></div></section>
        <section><Title as="h2" className="mb-4" tone="inherit" variant="card">Course completion</Title><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Enrollments" value={report.course_completion.enrolled} /><Metric label="Completed" value={report.course_completion.completed} /><Metric label="In progress" value={report.course_completion.in_progress} /><Metric label="Completion rate" value={`${report.course_completion.completion_rate}%`} /></div></section>
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6"><Title as="h2" tone="inherit" variant="card">Member engagement</Title><div className="mt-4 grid grid-cols-2 gap-4"><Metric label="Active members" value={report.member_engagement.active_members} /><Metric label="Event participants" value={report.member_engagement.event_participants} /><Metric label="Completed lessons" value={report.member_engagement.completed_lessons} /><Metric label="Prayers (30 days)" value={report.member_engagement.prayers_last_30_days} /></div></Card>
          <Card className="p-6"><Title as="h2" tone="inherit" variant="card">Serving workload</Title><Text className="mt-1" variant="small">{report.serving_workload.assignments} assignments across {report.serving_workload.serving_members} members</Text><div className="mt-4 space-y-2">{report.serving_workload.members.map((member) => <div className="flex justify-between border-b border-[var(--border-subtle)] py-2" key={member.user_id}><span>{member.name}</span><strong>{member.assignments}</strong></div>)}</div></Card>
        </section>
      </> : <Text as="p" tone="inherit" variant="inherit">{reportQuery.isError ? "Unable to load operational reports." : "Loading reports…"}</Text>}

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] p-5"><Title as="h2" tone="inherit" variant="card">Recent audit activity</Title><Text variant="small">Successful administrative changes are recorded without request-body content.</Text></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[var(--border-subtle)]"><th className="p-3">Time</th><th className="p-3">User</th><th className="p-3">Action</th></tr></thead><tbody>{(auditQuery.data?.items ?? []).map((item) => <tr className="border-b border-[var(--border-subtle)]" key={item.id}><td className="p-3">{new Date(item.occurred_at).toLocaleString()}</td><td className="p-3">{item.user.username}</td><td className="p-3 font-mono text-xs">{item.event_type}</td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}

