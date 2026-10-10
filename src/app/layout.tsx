import type { Metadata, Viewport } from "next";



export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "PalleRide — Village to City Rides",
  description: "Shared rides, car rentals and buy/sell across Telangana. Book on WhatsApp.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "PalleRide",
    title: "PalleRide — Village to City Rides",
    description: "Shared rides, car rentals and buy/sell across Telangana.",
    url: "/",
  },
  icons: { icon: "/logo.png", apple: "/logo.png" },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = {
  themeColor: "var(--primary-hover)",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import { Suspense } from "react";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { RootChrome } from "@/components/root-chrome";
import { PwaRegister } from "@/components/pwa-register";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)] pb-[90px] md:pb-8">
        <LangProvider>
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <RootChrome>{children}</RootChrome>
          </Suspense>
          <PwaRegister />
        </LangProvider>
      </body>
    </html>
  );
}



