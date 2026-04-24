CREATE TABLE "event_church_unit_targets" (
    "event_id" UUID NOT NULL,
    "church_unit_id" UUID NOT NULL,

    CONSTRAINT "event_church_unit_targets_pkey" PRIMARY KEY ("event_id","church_unit_id")
);

CREATE INDEX "event_church_unit_targets_church_unit_id_idx" ON "event_church_unit_targets"("church_unit_id");

ALTER TABLE "event_church_unit_targets"
ADD CONSTRAINT "event_church_unit_targets_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_church_unit_targets"
ADD CONSTRAINT "event_church_unit_targets_church_unit_id_fkey"
FOREIGN KEY ("church_unit_id") REFERENCES "church_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
