import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    lang: "vi",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#123252",
    icons: [
      { src: "/church-favicon.webp", sizes: "512x512", type: "image/webp", purpose: "any" },
    ],
  };
}
