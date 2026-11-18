import type { Metadata } from "next";
import { CraftPageRenderer } from "@/components/page-builder/CraftPageRenderer";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "Contact",
  "Contact HTNC and find information about connecting with our church community.",
  "/contact",
);

export default function ContactRoute() {
  return <CraftPageRenderer path="/contact" />;
}
