import type { Metadata } from "next";
import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "About",
  "Learn about HTNC, our church community, mission, and values.",
  "/about",
);

export default function AboutRoute() {
  return <CraftPageRenderer path="/about" />;
}
