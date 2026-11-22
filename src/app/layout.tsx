import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const fraunces = localFont({ src: "../assets/fonts/fraunces.woff2", variable: "--font-fraunces", weight: "100 900", display: "swap" });
const inter = localFont({ src: "../assets/fonts/inter.woff2", variable: "--font-inter", weight: "100 900", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "THREADIFY",
  openGraph: { type: "website", siteName: "THREADIFY", locale: "en_IN", title: "THREADIFY — Custom T-Shirt Studio", description: "Wear Your Point of View. Ready-made graphic tees and personalised printed T-shirts." },
  twitter: { card: "summary_large_image" },
  title: {
    default: "THREADIFY — Custom T-Shirt Studio",
    template: "%s | THREADIFY",
  },
  description:
    "Wear Your Point of View. Ready-made graphic tees and personalised printed T-shirts. Demo store for an academic project.",
};

export const viewport: Viewport = {
  themeColor: "#F3EFE6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
