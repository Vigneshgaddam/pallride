import { Metadata } from "next";
import PageClient from "./page.client";

export const metadata: Metadata = {
  title: "Safety & moderation — PalleRide",
  description: "How PalleRide keeps rides safe with reporting and moderation.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Safety & moderation — PalleRide",
    description: "Safety guidelines and reporting tools.",
    type: "website",
    url: "/safety",
  },
};

export default function Page() {
  return <PageClient />;
}