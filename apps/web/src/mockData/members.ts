export type MemberRole = "member" | "editor" | "instructor" | "admin";
export type MemberStatus = "pending" | "active" | "suspended";

export type ChurchMember = {
  id: string;
  email: string;
  full_name: string;
  display_name: string | null;
  role: MemberRole;
  status: MemberStatus;
  avatar_url: string | null;
  bio: string | null;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const memberMockData: ChurchMember[] = [
  {
    id: "b6b4a785-d212-4d39-9f8f-b93fd764d301",
    email: "minh.tran@httlncvn.local",
    full_name: "Minh Tran",
    display_name: "Minh",
    role: "instructor",
    status: "active",
    avatar_url: null,
    bio: "Prayer course instructor and small group mentor.",
    email_verified_at: "2026-03-01T10:00:00.000Z",
    last_login_at: "2026-04-20T14:00:00.000Z",
    created_at: "2026-02-12T09:00:00.000Z",
    updated_at: "2026-04-20T14:00:00.000Z",
    deleted_at: null,
  },
  {
    id: "51bb0f98-ef92-4df1-b6d6-b612d8de9a12",
    email: "linh.nguyen@httlncvn.local",
    full_name: "Linh Nguyen",
    display_name: "Linh",
    role: "admin",
    status: "active",
    avatar_url: null,
    bio: "Church admin coordinating events and member care workflows.",
    email_verified_at: "2026-02-20T08:00:00.000Z",
    last_login_at: "2026-04-21T07:30:00.000Z",
    created_at: "2026-02-01T09:00:00.000Z",
    updated_at: "2026-04-21T07:30:00.000Z",
    deleted_at: null,
  },
  {
    id: "2e05f8f3-263e-4e54-9b40-420f27b003ef",
    email: "grace.pham@httlncvn.local",
    full_name: "Grace Pham",
    display_name: "Grace",
    role: "member",
    status: "active",
    avatar_url: null,
    bio: "Care team volunteer and prayer journal contributor.",
    email_verified_at: "2026-03-15T12:00:00.000Z",
    last_login_at: "2026-04-18T16:45:00.000Z",
    created_at: "2026-03-10T09:00:00.000Z",
    updated_at: "2026-04-18T16:45:00.000Z",
    deleted_at: null,
  },
  {
    id: "cfe22ea4-a86e-4ed0-aa0e-ec9e097bf891",
    email: "david.le@httlncvn.local",
    full_name: "David Le",
    display_name: null,
    role: "editor",
    status: "pending",
    avatar_url: null,
    bio: "Content editor onboarding for public Article updates.",
    email_verified_at: null,
    last_login_at: null,
    created_at: "2026-04-01T09:00:00.000Z",
    updated_at: "2026-04-01T09:00:00.000Z",
    deleted_at: null,
  },
  {
    id: "4bd5a512-3050-4744-a5db-fb7c144d2677",
    email: "anna.vo@httlncvn.local",
    full_name: "Anna Vo",
    display_name: "Anna",
    role: "member",
    status: "suspended",
    avatar_url: null,
    bio: "Member account temporarily paused by church admin.",
    email_verified_at: "2026-01-11T09:30:00.000Z",
    last_login_at: "2026-03-28T10:20:00.000Z",
    created_at: "2026-01-08T09:00:00.000Z",
    updated_at: "2026-03-28T10:20:00.000Z",
    deleted_at: null,
  },
];
