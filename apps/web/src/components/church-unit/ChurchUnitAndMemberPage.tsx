"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Building2, Users } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { useTranslation } from "@/providers/I18nProvider";
import { ChurchUnitPage } from "./ChurchUnitPage";
import { MemberPage } from "@/components/member/MemberPage";
import { cn } from "@/components/ui";
import { Suspense } from "react";

type ChurchUnitAndMemberPageProps = {
  admin?: boolean;
};

function ChurchTabsContent({ admin = false }: ChurchUnitAndMemberPageProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get active tab from query params, default to "unit"
  const activeTab = searchParams.get("tab") === "member" ? "member" : "unit";

  const handleTabChange = (tab: "unit" | "member") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <PageLayout
      description={
        activeTab === "member"
          ? (admin ? t("admin.members.description") : t("page.member.description"))
          : (admin ? t("admin.churchUnits.description") : t("page.churchUnit.description"))
      }
      eyebrow={admin ? t("admin.common.admin") : (activeTab === "member" ? t("page.member.eyebrow") : t("page.churchUnit.eyebrow"))}
      title={t("nav.church.label")}
    >
      <div className="flex flex-col gap-6 -mt-4">
        {/* Tabs Header */}
        <div className="border-b border-[var(--border-subtle)]">
          <div className="flex gap-6">
            <button
              onClick={() => handleTabChange("unit")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-bold transition-all duration-200",
                activeTab === "unit"
                  ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Building2 className="h-4 w-4" />
              Unit
            </button>
            <button
              onClick={() => handleTabChange("member")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-bold transition-all duration-200",
                activeTab === "member"
                  ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Users className="h-4 w-4" />
              Member
            </button>
          </div>
        </div>

        {/* Tabs Content */}
        <div>
          {activeTab === "unit" ? (
            <ChurchUnitPage admin={admin} hideLayout={true} />
          ) : (
            <MemberPage admin={admin} hideLayout={true} />
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export function ChurchUnitAndMemberPage({ admin = false }: ChurchUnitAndMemberPageProps) {
  return (
    <Suspense fallback={null}>
      <ChurchTabsContent admin={admin} />
    </Suspense>
  );
}
