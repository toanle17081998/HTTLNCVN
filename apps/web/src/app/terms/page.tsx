import type { Metadata } from "next";
import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "Terms",
  "Read the terms for using the HTNC Platform.",
  "/terms",
);

export default function TermsRoute() {
  return <CraftPageRenderer path="/terms" />;
}
