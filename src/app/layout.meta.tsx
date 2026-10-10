import { Metadata } from "next";

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