import { Truck, CircleCheck, SquareArrowOutUpRight, ShieldAlert, Star, AlertTriangle, KeyRound, Tag } from "lucide-react";

const ACCENT: Record<string, string> = {
  "": "text-[var(--primary)]",
  users: "text-[var(--primary)]", verifications: "text-amber-500", trips: "text-sky-500",
  reports: "text-red-500", reviews: "text-sky-500", incidents: "text-red-600",
  rentals: "text-indigo-500", cars: "text-fuchsia-500",
};

export type Stat = { key: string; label: string; value: number; href: string };

import Link from "next/link";

export function AdminStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon =
          s.key === "users" ? Truck : s.key === "verifications" ? CircleCheck :
          s.key === "trips" ? SquareArrowOutUpRight : s.key === "reports" ? ShieldAlert :
          s.key === "reviews" ? Star : s.key === "incidents" ? AlertTriangle :
          s.key === "rentals" ? KeyRound : Tag;
        return (
          <Link key={s.key} href={s.href} className="rounded-2xl border bg-[var(--card)] p-4 hover:shadow-sm">
            <Icon size={18} className={ACCENT[s.key] || ACCENT[""]} />
            <p className="mt-2 text-2xl font-black">{s.value}</p>
            <p className="text-[12px] text-[var(--muted)] font-semibold">{s.label}</p>
          </Link>
        );
      })}
    </div>
  );
}