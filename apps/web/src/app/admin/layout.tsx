import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const metadata: Metadata = { robots: { follow: false, index: false } };

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
