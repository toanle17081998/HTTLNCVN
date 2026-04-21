export type PrayerVisibility = "public" | "private" | "shared";
export type PrayerStatus = "open" | "closed";

export type PrayerCategory = {
  id: number;
  name: string;
  description: string | null;
};

export type Prayer = {
  id: string;
  title: string | null;
  content: string;
  visibility: PrayerVisibility;
  status: PrayerStatus;
  close_reason: string | null;
  category_id: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type PrayerShare = {
  prayer_id: string;
  user_id: string;
  shared_at: string;
};

export const prayerCategoryMockData: PrayerCategory[] = [
  {
    id: 1,
    name: "Healing",
    description: "Prayers for physical, emotional, and spiritual healing.",
  },
  {
    id: 2,
    name: "Family",
    description: "Prayers for marriages, children, and household unity.",
  },
  {
    id: 3,
    name: "Guidance",
    description: "Prayers seeking direction and wisdom for life decisions.",
  },
  {
    id: 4,
    name: "Thanksgiving",
    description: "Prayers of gratitude and praise to God.",
  },
  {
    id: 5,
    name: "Intercession",
    description: "Prayers standing in the gap for others in need.",
  },
  {
    id: 6,
    name: "Church",
    description: "Prayers for the health, unity, and mission of the church.",
  },
];

/** Matches created_by IDs with memberMockData */
export const prayerMockData: Prayer[] = [
  {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    title: "Healing for my mother",
    content:
      "Lord, I lift up my mother who has been struggling with illness these past months. I ask for Your healing hand to touch her body and restore her strength. Give our family grace and peace as we walk through this season together.",
    visibility: "shared",
    status: "open",
    close_reason: null,
    category_id: 1,
    created_by: "2e05f8f3-263e-4e54-9b40-420f27b003ef", // Grace Pham
    created_at: "2026-04-01T08:30:00.000Z",
    updated_at: "2026-04-01T08:30:00.000Z",
    closed_at: null,
  },
  {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    title: "Wisdom for my career decision",
    content:
      "Father, I face a crossroads in my career and I don't know which path to choose. Grant me clarity, wisdom, and the courage to follow wherever You lead. I trust that Your plans for me are good.",
    visibility: "private",
    status: "open",
    close_reason: null,
    category_id: 3,
    created_by: "b6b4a785-d212-4d39-9f8f-b93fd764d301", // Minh Tran
    created_at: "2026-04-05T19:00:00.000Z",
    updated_at: "2026-04-05T19:00:00.000Z",
    closed_at: null,
  },
  {
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    title: "Gratitude for this community",
    content:
      "Thank You, Lord, for the gift of this church family. Every Sunday I am reminded that I am not alone. Thank You for the friendships, the mentorship, and the shared worship that sustains us.",
    visibility: "public",
    status: "closed",
    close_reason: "Prayer answered and season of gratitude continues.",
    category_id: 4,
    created_by: "51bb0f98-ef92-4df1-b6d6-b612d8de9a12", // Linh Nguyen
    created_at: "2026-03-20T10:00:00.000Z",
    updated_at: "2026-04-10T10:00:00.000Z",
    closed_at: "2026-04-10T10:00:00.000Z",
  },
  {
    id: "a1b2c3d4-0004-4000-8000-000000000004",
    title: "Marriage restoration",
    content:
      "God, strengthen the bond in our marriage. Renew our love, improve our communication, and remind us daily of the covenant we made before You. Let grace flow freely between us.",
    visibility: "private",
    status: "open",
    close_reason: null,
    category_id: 2,
    created_by: "2e05f8f3-263e-4e54-9b40-420f27b003ef", // Grace Pham
    created_at: "2026-04-08T21:00:00.000Z",
    updated_at: "2026-04-08T21:00:00.000Z",
    closed_at: null,
  },
  {
    id: "a1b2c3d4-0005-4000-8000-000000000005",
    title: "Intercession for our nation",
    content:
      "Lord, we intercede for our nation and its leaders. Bring justice, mercy, and truth to those in power. Draw our people back to You and let righteousness be the foundation of our society.",
    visibility: "public",
    status: "open",
    close_reason: null,
    category_id: 5,
    created_by: "51bb0f98-ef92-4df1-b6d6-b612d8de9a12", // Linh Nguyen
    created_at: "2026-04-12T07:30:00.000Z",
    updated_at: "2026-04-12T07:30:00.000Z",
    closed_at: null,
  },
  {
    id: "a1b2c3d4-0006-4000-8000-000000000006",
    title: "Church vision and unity",
    content:
      "Father, give our church leadership a clear and unified vision for the year ahead. Remove division and pride. Let love and humility mark every meeting, every ministry team, and every heart.",
    visibility: "shared",
    status: "open",
    close_reason: null,
    category_id: 6,
    created_by: "b6b4a785-d212-4d39-9f8f-b93fd764d301", // Minh Tran
    created_at: "2026-04-15T17:00:00.000Z",
    updated_at: "2026-04-15T17:00:00.000Z",
    closed_at: null,
  },
  {
    id: "a1b2c3d4-0007-4000-8000-000000000007",
    title: "Peace in anxiety",
    content:
      "Jesus, the weight of worry is heavy today. You said to cast all my anxieties on You because You care for me. I choose to trust You now. Replace my fear with Your perfect peace that surpasses understanding.",
    visibility: "private",
    status: "closed",
    close_reason: "God brought peace and resolution to this season.",
    category_id: null,
    created_by: "2e05f8f3-263e-4e54-9b40-420f27b003ef", // Grace Pham
    created_at: "2026-03-28T22:00:00.000Z",
    updated_at: "2026-04-18T09:00:00.000Z",
    closed_at: "2026-04-18T09:00:00.000Z",
  },
  {
    id: "a1b2c3d4-0008-4000-8000-000000000008",
    title: "Provision for a new home",
    content:
      "Lord, we are trusting You to provide safe, affordable housing for our family. We have done what we can—now we wait on You. You are Jehovah Jireh, our provider.",
    visibility: "shared",
    status: "open",
    close_reason: null,
    category_id: 2,
    created_by: "b6b4a785-d212-4d39-9f8f-b93fd764d301", // Minh Tran
    created_at: "2026-04-19T08:00:00.000Z",
    updated_at: "2026-04-19T08:00:00.000Z",
    closed_at: null,
  },
];

/** Which prayers are shared with which users */
export const prayerShareMockData: PrayerShare[] = [
  {
    prayer_id: "a1b2c3d4-0001-4000-8000-000000000001",
    user_id: "51bb0f98-ef92-4df1-b6d6-b612d8de9a12",
    shared_at: "2026-04-01T09:00:00.000Z",
  },
  {
    prayer_id: "a1b2c3d4-0001-4000-8000-000000000001",
    user_id: "b6b4a785-d212-4d39-9f8f-b93fd764d301",
    shared_at: "2026-04-01T09:05:00.000Z",
  },
  {
    prayer_id: "a1b2c3d4-0006-4000-8000-000000000006",
    user_id: "51bb0f98-ef92-4df1-b6d6-b612d8de9a12",
    shared_at: "2026-04-15T17:30:00.000Z",
  },
  {
    prayer_id: "a1b2c3d4-0008-4000-8000-000000000008",
    user_id: "2e05f8f3-263e-4e54-9b40-420f27b003ef",
    shared_at: "2026-04-19T08:30:00.000Z",
  },
];
