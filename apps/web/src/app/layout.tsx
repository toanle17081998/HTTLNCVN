import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import { AppShell } from "@/components/layout";
import { AuthProvider } from "@/providers/AuthProvider";
import { FeedbackProvider } from "@/providers/FeedbackProvider";
import { I18nProvider } from "@/providers/I18nProvider";
import { TanStackProvider } from "@/providers/TanStackProvider";
import "ckeditor5/ckeditor5.css";
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
  title: "HTNC Platform",
  description: "Learning and community platform for HTNC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>
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
