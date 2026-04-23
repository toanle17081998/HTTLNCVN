import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout";
import { AuthProvider } from "@/providers/AuthProvider";
import { FeedbackProvider } from "@/providers/FeedbackProvider";
import { I18nProvider } from "@/providers/I18nProvider";
import { TanStackProvider } from "@/providers/TanStackProvider";
import "ckeditor5/ckeditor5.css";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
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
