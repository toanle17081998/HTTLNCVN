CREATE TABLE "homepage_content" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "hero_eyebrow_en" VARCHAR(120) NOT NULL DEFAULT 'HTNC Community',
    "hero_eyebrow_vi" VARCHAR(120) NOT NULL DEFAULT 'Cong dong HTNC',
    "hero_headline_en" VARCHAR(255) NOT NULL DEFAULT 'Learn, connect, and grow with HTNC',
    "hero_headline_vi" VARCHAR(255) NOT NULL DEFAULT 'Hoc, ket noi va tang truong cung HTNC',
    "hero_subheadline_en" TEXT NOT NULL DEFAULT 'Fresh teaching, upcoming gatherings, and recommended courses for the community.',
    "hero_subheadline_vi" TEXT NOT NULL DEFAULT 'Noi dung moi, su kien sap toi va khoa hoc duoc de xuat cho cong dong.',
    "hero_image_urls" JSONB NOT NULL DEFAULT '[]',
    "primary_cta_label_en" VARCHAR(120) NOT NULL DEFAULT 'Explore Courses',
    "primary_cta_label_vi" VARCHAR(120) NOT NULL DEFAULT 'Kham pha khoa hoc',
    "primary_cta_href" VARCHAR(255) NOT NULL DEFAULT '/course',
    "secondary_cta_label_en" VARCHAR(120) NOT NULL DEFAULT 'View Events',
    "secondary_cta_label_vi" VARCHAR(120) NOT NULL DEFAULT 'Xem su kien',
    "secondary_cta_href" VARCHAR(255) NOT NULL DEFAULT '/event',
    "stat_1_value" VARCHAR(40) NOT NULL DEFAULT '12',
    "stat_1_label_en" VARCHAR(120) NOT NULL DEFAULT 'Courses',
    "stat_1_label_vi" VARCHAR(120) NOT NULL DEFAULT 'Khoa hoc',
    "stat_2_value" VARCHAR(40) NOT NULL DEFAULT '28',
    "stat_2_label_en" VARCHAR(120) NOT NULL DEFAULT 'Lectures',
    "stat_2_label_vi" VARCHAR(120) NOT NULL DEFAULT 'Bai giang',
    "stat_3_value" VARCHAR(40) NOT NULL DEFAULT '6',
    "stat_3_label_en" VARCHAR(120) NOT NULL DEFAULT 'Gatherings',
    "stat_3_label_vi" VARCHAR(120) NOT NULL DEFAULT 'Buoi nhom',
    "articles_eyebrow_en" VARCHAR(120) NOT NULL DEFAULT 'Articles',
    "articles_eyebrow_vi" VARCHAR(120) NOT NULL DEFAULT 'Bai viet',
    "articles_title_en" VARCHAR(180) NOT NULL DEFAULT 'Latest Articles',
    "articles_title_vi" VARCHAR(180) NOT NULL DEFAULT 'Bai viet moi nhat',
    "events_eyebrow_en" VARCHAR(120) NOT NULL DEFAULT 'Events',
    "events_eyebrow_vi" VARCHAR(120) NOT NULL DEFAULT 'Su kien',
    "events_title_en" VARCHAR(180) NOT NULL DEFAULT 'Upcoming Events',
    "events_title_vi" VARCHAR(180) NOT NULL DEFAULT 'Su kien sap toi',
    "courses_eyebrow_en" VARCHAR(120) NOT NULL DEFAULT 'Courses',
    "courses_eyebrow_vi" VARCHAR(120) NOT NULL DEFAULT 'Khoa hoc',
    "courses_title_en" VARCHAR(180) NOT NULL DEFAULT 'Featured Courses',
    "courses_title_vi" VARCHAR(180) NOT NULL DEFAULT 'Khoa hoc noi bat',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homepage_content_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "homepage_content" ADD CONSTRAINT "homepage_content_singleton" CHECK ("id" = 1);

INSERT INTO "homepage_content" ("id") VALUES (1);
