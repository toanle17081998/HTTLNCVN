import type { Metadata } from "next";
import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "Privacy",
  "Read the HTNC Platform privacy policy.",
  "/privacy",
);

export default function PrivacyRoute() {
  return <CraftPageRenderer path="/privacy" />;
}
