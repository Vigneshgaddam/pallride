"use client";
import Link from "next/link";
import {
  Plus, Car, Ticket, KeyRound, Tag, User, Star, Shield, BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";
import { useRequireDriver } from "@/components/trip-form";

type Action = {
  href: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  primary?: boolean;
};

export default function DashboardHome() {
  const t = useT();
  const { te } = useLang();
  const { name, phone } = useDriver();
  const { token, ready } = useRequireDriver();

  const ACTIONS: Action[] = [
    { href: "/dashboard/trips/new", label: t("Post a trip"), sub: te ? "ప్రయాణం ప్రచురించండి" : "Publish a new ride", icon: Plus, primary: true },
    { href: "/dashboard/trips", label: t("My trips"), sub: te ? "ట్రిప్పులు నిర్వహించండి" : "Manage your trips", icon: Car },
    { href: "/dashboard/requests", label: t("Requests"), sub: te ? "బుకింగ్ అభ్యర్థనలు" : "Passenger bookings", icon: Ticket },
    { href: "/dashboard/vehicles", label: t("Vehicle"), sub: te ? "మీ వాహనాలు" : "Your vehicles", icon: KeyRound },
    { href: "/dashboard/rentals", label: t("My rentals"), sub: te ? "అద్దె లిస్టింగ్‌లు" : "Rental listings", icon: KeyRound },
    { href: "/dashboard/sales", label: t("My cars for sale"), sub: te ? "అమ్మకం లిస్టింగ్‌లు" : "Buy & sell listings", icon: Tag },
    { href: "/dashboard/profile", label: t("Profile"), sub: te ? "ప్రొఫైల్ మార్చండి" : "Edit your profile", icon: User },
    { href: "/dashboard/ratings", label: t("Ratings & reviews"), sub: te ? "మీ రేటింగ్‌లు" : "Your reviews", icon: Star },
    { href: "/dashboard/verification", label: t("Verification"), sub: te ? "ధృవీకరణ స్థితి" : "Verification status", icon: BadgeCheck },
    { href: "/dashboard/safety", label: t("Safety"), sub: te ? "భద్రతా కేంద్రం" : "Safety center", icon: Shield },
  ];

  if (!ready || !token) {
    return <p className="text-center text-[var(--mute)] py-10">…</p>;
  }

  return (
    <div className="pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-extrabold">{t("driverDashboard")}</h1>
          <p className="text-sm text-[var(--mute)] mt-0.5">
            {name || t("PalleRide Driver")}{phone ? ` · +91 ${phone}` : ""}
          </p>
        </div>
        <Link href="/dashboard/trips/new">
          <Button className="!w-auto !py-2 flex items-center gap-1.5">
            <Plus size={16} /> {t("Post a trip")}
          </Button>
        </Link>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map(({ href, label, sub, icon: Icon, primary }) => (
          <Link key={href} href={href} className="block">
            <Card
              className={
                "!mb-0 h-full flex items-center gap-3 hover:shadow-[0_8px_24px_rgba(10,61,48,.10)] transition-shadow " +
                (primary ? "!bg-[var(--forest)] !border-[var(--forest)] text-white" : "")
              }
            >
              <span className={"rounded-full p-2.5 shrink-0 " + (primary ? "bg-white/15" : "bg-[var(--tealbg)]")}>
                <Icon size={18} className={primary ? "text-white" : "text-[var(--primary)]"} />
              </span>
              <span className="min-w-0">
                <b className="block text-sm">{label}</b>
                <span className={"block text-xs " + (primary ? "text-white/70" : "text-[var(--mute)]")}>{sub}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
