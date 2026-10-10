import { Metadata } from "next";
import PageClient from "./page.client";

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

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PageClient searchParams={searchParams} />;
}