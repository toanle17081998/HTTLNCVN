"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";

export type OperationalReport = {
  attendance: { course_check_ins: number; event_check_ins: number; unique_course_attendees: number; unique_event_attendees: number };
  course_completion: { completed: number; completion_rate: number; enrolled: number; in_progress: number };
  generated_at: string;
  member_engagement: { active_members: number; completed_lessons: number; event_participants: number; prayers_last_30_days: number };
  serving_workload: { assignments: number; members: Array<{ assignments: number; name: string; user_id: string }>; serving_members: number };
};

export type AuditLogResult = {
  items: Array<{
    event_type: string;
    id: string;
    metadata: unknown;
    occurred_at: string;
    user: { email: string; id: string; username: string };
  }>;
  total: number;
};

export function useOperationalReportQuery() {
  return useQuery({ queryFn: () => apiRequest<OperationalReport>("/reports/operations"), queryKey: ["reports", "operations"] });
}

export function useAuditLogsQuery() {
  return useQuery({ queryFn: () => apiRequest<AuditLogResult>("/audit-logs?take=20"), queryKey: ["audit-logs"] });
}

export function exportMyData() {
  return apiRequest<Record<string, unknown>>("/privacy/export");
}
