import type { Metadata } from "next";
import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";
import { getServerLocale } from "@/lib/server-locale";
import { createBilingualPageMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return createBilingualPageMetadata(
    {
      vi: {
        title: "Giới thiệu",
        description: "Tìm hiểu về Hội Thánh Tin Lành Nhân Cấp (HTTLNC), cộng đồng, sứ mạng và các giá trị cốt lõi.",
      },
      en: {
        title: "About",
        description: "Learn about Multiplying Evangelical Church (MEC), our church community, mission, and core values.",
      },
    },
    "/about",
    locale,
  );
}

export default function AboutRoute() {
  return <CraftPageRenderer path="/about" />;
}
