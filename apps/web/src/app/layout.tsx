import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import { AppShell } from "@/components/layout";
import { WebMcpBridge } from "@/components/seo/WebMcpBridge";
import { AuthProvider } from "@/providers/AuthProvider";
import { FeedbackProvider } from "@/providers/FeedbackProvider";
import { I18nProvider } from "@/providers/I18nProvider";
import { TanStackProvider } from "@/providers/TanStackProvider";
import { absoluteUrl, getSiteDescription, getSiteName, getSiteShortName, getSiteUrl, siteConfig } from "@/lib/site";
import { getServerLocale } from "@/lib/server-locale";
import "@/css/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
});

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const viewport: Viewport = {
  themeColor: "#123252",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const siteName = getSiteName(locale);
  const shortName = getSiteShortName(locale);
  const description = getSiteDescription(locale);

  return {
    metadataBase: getSiteUrl(),
    title: {
      default: siteName,
      template: `%s | ${shortName}`,
    },
    description,
    applicationName: siteName,
    authors: [{ name: siteName, url: "/" }],
    creator: siteName,
    publisher: siteName,
    category: "religion",
    keywords: [
      "Hội Thánh Tin Lành Nhân Cấp",
      "HTTLNC",
      "Multiplying Evangelical Church",
      "MEC",
      "Hội Thánh Tin Lành",
      "Tin Lành Việt Nam",
      "khóa học Kinh Thánh",
      "bài viết Cơ Đốc",
      "sự kiện Hội Thánh",
      "Vietnamese Evangelical Church",
      "Christian community",
      "Bible courses",
    ],
    icons: {
      icon: [
        { url: "/church-logo.svg", type: "image/svg+xml" },
        { url: "/church-logo.png", type: "image/png" },
      ],
      shortcut: "/church-logo.png",
      apple: "/church-logo.png",
    },
    alternates: {
      canonical: "/",
      languages: {
        vi: "/",
        en: "/",
        "x-default": "/",
      },
    },
    openGraph: {
      description,
      locale: locale === "en" ? "en_US" : "vi_VN",
      alternateLocale: [locale === "en" ? "vi_VN" : "en_US"],
      siteName,
      title: siteName,
      type: "website",
      url: "/",
      images: [{ url: "/church-logo.png", alt: siteName }],
    },
    robots: {
      follow: true,
      index: true,
      googleBot: {
        follow: true,
        index: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    twitter: {
      card: "summary_large_image",
      description,
      images: ["/church-logo.png"],
      title: siteName,
    },
    ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const siteName = getSiteName(locale);
  const description = getSiteDescription(locale);
  const siteUrl = absoluteUrl("/");
  const logoUrl = absoluteUrl("/church-logo.png");
  const alternateNames = [
    siteConfig.names.vi,
    siteConfig.shortNames.vi,
    siteConfig.names.en,
    siteConfig.shortNames.en,
  ].filter((value) => value !== siteName);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Church",
        "@id": `${siteUrl}#organization`,
        name: siteName,
        alternateName: alternateNames,
        description,
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
        },
        image: logoUrl,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: siteName,
        alternateName: alternateNames,
        description,
        inLanguage: ["vi", "en"],
        publisher: {
          "@id": `${siteUrl}#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${absoluteUrl("/article")}?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { let theme; try { theme = localStorage.getItem("httlncvn.theme"); } catch {} if (theme !== "light" && theme !== "dark") theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; document.documentElement.dataset.theme = theme; })();`,
          }}
        />
        <link href={absoluteUrl("/.well-known/ard.json")} rel="ard" />
        <link href={absoluteUrl("/.well-known/agent-card.json")} rel="agent-card" type="application/json" />
        <link href={absoluteUrl("/llms.txt")} rel="llms-txt" type="text/plain" />
        <link href={absoluteUrl("/sitemap.xml")} rel="sitemap" type="application/xml" />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
          type="application/ld+json"
        />
        <WebMcpBridge />
        <TanStackProvider>
          <I18nProvider>
            <AuthProvider>
              <FeedbackProvider>
                <AppShell>{children}</AppShell>
              </FeedbackProvider>
            </AuthProvider>
          </I18nProvider>
        </TanStackProvider>
      </body>
    </html>
  );
}
