import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Buy cars — PalleRide",
  description: "Browse used cars for sale across Telangana.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Buy cars — PalleRide",
    description: "Used cars marketplace in Telangana.",
    type: "website",
    url: "/cars",
  },
};

export default function BuyPage() {
  redirect("/cars");
}