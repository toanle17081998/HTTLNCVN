import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HTNC Platform",
    short_name: "HTNC",
    description: "Learning and community platform for HTNC.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#123252",
    icons: [{ src: "/church-logo.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
