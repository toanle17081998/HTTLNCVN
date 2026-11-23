import { PrayerJournalPage } from "@/components/prayer-journal/PrayerJournalPage";
import { FeatureFlagGate } from "@/components/FeatureFlagGate";

export default function PrayerJournalRoute() {
  return <FeatureFlagGate feature="prayer-journal"><PrayerJournalPage /></FeatureFlagGate>;
}
