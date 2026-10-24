import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import { SiteSettingsProvider } from "@/components/SiteSettings";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ATIB Jugend Vorarlberg | Gemeinsam sind wir stärker",
  description:
    "Die ATIB Jugend Vorarlberg verbindet junge Menschen durch Begegnung, Bildung, Sport und gemeinsame Werte.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" data-theme="light" className={`${inter.variable} ${geist.variable}`}>
      <body>
        <SiteSettingsProvider>{children}</SiteSettingsProvider>
      </body>
    </html>
  );
}
