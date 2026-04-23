CREATE TABLE "pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(255) NOT NULL,
    "route_path" VARCHAR(255) NOT NULL,
    "title_en" VARCHAR(255) NOT NULL,
    "title_vi" VARCHAR(255) NOT NULL,
    "content_json" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");
CREATE UNIQUE INDEX "pages_route_path_key" ON "pages"("route_path");
CREATE INDEX "pages_created_by_idx" ON "pages"("created_by");

ALTER TABLE "pages"
ADD CONSTRAINT "pages_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
