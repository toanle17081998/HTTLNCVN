import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
  { hostname: "images.unsplash.com", protocol: "https" },
];

const { hostname, port, protocol } = new URL(apiUrl);
remotePatterns.push({
  hostname,
  port,
  protocol: protocol.replace(":", "") as "http" | "https",
});

const nextConfig: NextConfig = {
  allowedDevOrigins: appUrl ? [new URL(appUrl).hostname] : [],
  async headers() {
    return [
      {
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
        source: "/:path*",
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns,
  },
  output: "standalone",
};

export default nextConfig;
