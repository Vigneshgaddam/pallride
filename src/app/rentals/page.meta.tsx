import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Car rentals — PalleRide",
  description: "Rent cars by day across Telangana. WhatsApp enquiries.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Car rentals — PalleRide",
    description: "Affordable car rentals across Telangana.",
    type: "website",
    url: "/rentals",
  },
};

export { default } from "./page.client";