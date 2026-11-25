import type { Metadata } from "next";
import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";
import { getServerLocale } from "@/lib/server-locale";
import { createBilingualPageMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return createBilingualPageMetadata(
    {
      vi: {
        title: "Điều khoản sử dụng",
        description: "Đọc điều khoản sử dụng cổng thông tin Hội Thánh Tin Lành Nhân Cấp (HTTLNC).",
      },
      en: {
        title: "Terms of Use",
        description: "Read the terms of use for Multiplying Evangelical Church (MEC).",
      },
    },
    "/terms",
    locale,
  );
}

export default function TermsRoute() {
  return <CraftPageRenderer path="/terms" />;
}
