import { Metadata } from "next";
import PageClient from "./page.client";

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

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PageClient searchParams={searchParams} />;
}