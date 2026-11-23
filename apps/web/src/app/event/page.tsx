import type { Metadata } from "next";
import { EventPage } from "@/components/event/EventPage";
import { createPageMetadata } from "@/lib/site";
import { FeatureFlagGate } from "@/components/FeatureFlagGate";

export const metadata: Metadata = createPageMetadata(
  "Events",
  "Find upcoming HTNC gatherings, services, and community events.",
  "/event",
);

export default function EventRoute() {
  return <FeatureFlagGate feature="event"><EventPage /></FeatureFlagGate>;
}
