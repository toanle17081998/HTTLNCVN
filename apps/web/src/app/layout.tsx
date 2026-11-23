import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import { AppShell } from "@/components/layout";
import { WebMcpBridge } from "@/components/seo/WebMcpBridge";
import { AuthProvider } from "@/providers/AuthProvider";
import { FeedbackProvider } from "@/providers/FeedbackProvider";
import { I18nProvider } from "@/providers/I18nProvider";
import { TanStackProvider } from "@/providers/TanStackProvider";
import { absoluteUrl, getSiteUrl, siteConfig } from "@/lib/site";
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

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  category: "community",
  keywords: ["HTNC", "church", "Christian community", "Bible courses", "church events", "Vietnamese church"],
  openGraph: {
    description: siteConfig.description,
    locale: "en_US",
    alternateLocale: ["vi_VN"],
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: "website",
    url: "/",
    images: [{ url: "/church-logo.png", alt: siteConfig.name }],
  },
  robots: {
    follow: true,
    index: true,
    googleBot: { follow: true, index: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  twitter: {
    card: "summary_large_image",
    description: siteConfig.description,
    images: ["/church-logo.png"],
    title: siteConfig.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/church-logo.png"),
  };

  return (
    <html
      lang="en"
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
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
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
