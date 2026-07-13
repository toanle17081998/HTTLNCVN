UPDATE "pages"
SET "status" = 'deleted'
WHERE "deleted_at" IS NOT NULL;

ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "pages_slug_key";
ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "pages_route_path_key";

CREATE UNIQUE INDEX "pages_active_slug_key"
ON "pages" ("slug")
WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "pages_active_route_path_key"
ON "pages" ("route_path")
WHERE "deleted_at" IS NULL;
