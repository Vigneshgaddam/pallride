import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rides — PalleRide",
  description: "Find shared rides from village to city across Telangana. Book on WhatsApp.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Rides — PalleRide",
    description: "Village to city shared rides in Telangana.",
    type: "website",
    url: "/trips",
  },
};

export { default } from "./page.client";