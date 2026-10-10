import { Metadata } from "next";
import PageClient from "./page.client";

export const metadata: Metadata = {
  title: "Cars for sale — PalleRide",
  description: "Used cars for sale across Telangana. WhatsApp enquiries.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Cars for sale — PalleRide",
    description: "Browse used cars in Telangana.",
    type: "website",
    url: "/cars",
  },
};

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PageClient searchParams={searchParams} />;
}