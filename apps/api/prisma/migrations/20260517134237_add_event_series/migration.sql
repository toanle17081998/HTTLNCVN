-- AlterTable
ALTER TABLE "events" ADD COLUMN     "is_all_day" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "series_id" UUID;

-- CreateTable
CREATE TABLE "event_series" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(150) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "location" VARCHAR(255),
    "cover_image_url" TEXT,
    "color" VARCHAR(50),
    "repeat" VARCHAR(50) NOT NULL DEFAULT 'none',
    "category_id" INTEGER,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "event_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_series_slug_key" ON "event_series"("slug");

-- CreateIndex
CREATE INDEX "event_series_category_id_idx" ON "event_series"("category_id");

-- CreateIndex
CREATE INDEX "event_series_created_by_idx" ON "event_series"("created_by");

-- CreateIndex
CREATE INDEX "events_series_id_idx" ON "events"("series_id");

-- AddForeignKey
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "event_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
