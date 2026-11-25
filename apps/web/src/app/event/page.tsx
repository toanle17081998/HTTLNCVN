import type { Metadata } from "next";
import { EventPage } from "@/components/event/EventPage";
import { getServerLocale } from "@/lib/server-locale";
import { createBilingualPageMetadata } from "@/lib/site";
import { FeatureFlagGate } from "@/components/FeatureFlagGate";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return createBilingualPageMetadata(
    {
      vi: {
        title: "Sự kiện",
        description: "Xem các buổi nhóm, sự kiện và sinh hoạt cộng đồng sắp tới của Hội Thánh Tin Lành Nhân Cấp (HTTLNC).",
      },
      en: {
        title: "Events",
        description: "Find upcoming gatherings, services, and community events at Multiplying Evangelical Church (MEC).",
      },
    },
    "/event",
    locale,
  );
}

export default function EventRoute() {
  return <FeatureFlagGate feature="event"><EventPage /></FeatureFlagGate>;
}
