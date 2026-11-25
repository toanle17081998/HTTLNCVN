import type { Metadata } from "next";
import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";
import { getServerLocale } from "@/lib/server-locale";
import { createBilingualPageMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return createBilingualPageMetadata(
    {
      vi: {
        title: "Chính sách bảo mật",
        description: "Đọc chính sách bảo mật của Hội Thánh Tin Lành Nhân Cấp (HTTLNC).",
      },
      en: {
        title: "Privacy Policy",
        description: "Read the privacy policy for Multiplying Evangelical Church (MEC).",
      },
    },
    "/privacy",
    locale,
  );
}

export default function PrivacyRoute() {
  return <CraftPageRenderer path="/privacy" />;
}
