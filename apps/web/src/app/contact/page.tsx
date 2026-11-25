import type { Metadata } from "next";
import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";
import { getServerLocale } from "@/lib/server-locale";
import { createBilingualPageMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return createBilingualPageMetadata(
    {
      vi: {
        title: "Liên hệ",
        description: "Liên hệ và kết nối với cộng đồng Hội Thánh Tin Lành Nhân Cấp (HTTLNC).",
      },
      en: {
        title: "Contact",
        description: "Contact and connect with Multiplying Evangelical Church (MEC).",
      },
    },
    "/contact",
    locale,
  );
}

export default function ContactRoute() {
  return <CraftPageRenderer path="/contact" />;
}
