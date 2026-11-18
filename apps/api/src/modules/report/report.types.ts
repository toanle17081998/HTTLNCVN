export type OperationalReportDto = {
  attendance: {
    course_check_ins: number;
    event_check_ins: number;
    unique_course_attendees: number;
    unique_event_attendees: number;
  };
  course_completion: {
    completed: number;
    completion_rate: number;
    enrolled: number;
    in_progress: number;
  };
  generated_at: string;
  member_engagement: {
    active_members: number;
    completed_lessons: number;
    event_participants: number;
    prayers_last_30_days: number;
  };
  serving_workload: {
    assignments: number;
    members: Array<{ assignments: number; name: string; user_id: string }>;
    serving_members: number;
  };
};

