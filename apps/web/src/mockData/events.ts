export type EventAudience = "public" | "church";
export type EventRepeat = "none" | "daily" | "weekly" | "monthly" | "weekdays";

export type ChurchEvent = {
  id: string;
  title: string;
  audience: EventAudience;
  startsAt: string;
  endsAt: string;
  location: string;
  description: string;
  color: string;
  cover_image_url?: string | null;
  repeat: EventRepeat;
  slug?: string;
};

export const eventColors = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
] as const;

export const eventMockData: ChurchEvent[] = [
  {
    id: "community-night",
    title: "Community Night",
    audience: "public",
    startsAt: "2026-04-25T18:00",
    endsAt: "2026-04-25T20:00",
    location: "Main Hall",
    description: "Dinner, worship, and newcomer conversations.",
    color: "#2563eb",
    cover_image_url:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
    repeat: "none",
    slug: "community-night",
  },
  {
    id: "member-prayer",
    title: "Member Prayer Room",
    audience: "church",
    startsAt: "2026-04-29T19:30",
    endsAt: "2026-04-29T20:30",
    location: "Online",
    description: "Shared prayer requests and guided intercession.",
    color: "#9333ea",
    cover_image_url:
      "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=1200&q=80",
    repeat: "weekly",
    slug: "member-prayer-room",
  },
  {
    id: "serve-day",
    title: "Serve Day",
    audience: "public",
    startsAt: "2026-05-04T09:00",
    endsAt: "2026-05-04T12:00",
    location: "Community Center",
    description: "Volunteer morning for local neighborhood support.",
    color: "#16a34a",
    cover_image_url:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    repeat: "none",
    slug: "serve-day",
  },
  {
    id: "leaders-sync",
    title: "Leaders Sync",
    audience: "church",
    startsAt: "2026-05-12T18:30",
    endsAt: "2026-05-12T19:30",
    location: "Room 204",
    description: "Planning, follow-up, and ministry calendar alignment.",
    color: "#ea580c",
    cover_image_url:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    repeat: "monthly",
    slug: "leaders-sync",
  },
];
