CREATE TABLE "feature_flags" (
    "key" VARCHAR(50) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key")
);

INSERT INTO "feature_flags" ("key", "enabled")
VALUES ('event', true), ('prayer-journal', true);
