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
      { src: "/church-logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/church-logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
