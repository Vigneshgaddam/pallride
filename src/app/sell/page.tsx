import { Metadata } from "next";
import PageClient from "./page.client";

export const metadata: Metadata = {
  title: "Sell cars — PalleRide",
  description: "Sell your car in Telangana. Free listing, WhatsApp enquiries.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Sell cars — PalleRide",
    description: "Free car listing with WhatsApp enquiries.",
    type: "website",
    url: "/sell",
  },
};

export default function Page() {
  return <PageClient />;
}