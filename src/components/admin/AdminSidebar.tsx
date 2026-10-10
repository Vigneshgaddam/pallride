"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, IdCard, FileBadge, Bus, Ticket, KeyRound,
  Tag, Star, Flag, ShieldAlert, ScrollText, Settings, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/drivers", label: "Drivers", icon: IdCard },
  { href: "/admin/verifications", label: "Verifications", icon: FileBadge },
  { href: "/admin/trips", label: "Live Trips", icon: Bus },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/rentals", label: "Rentals", icon: KeyRound },
  { href: "/admin/listings", label: "Buy & Sell", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/safety", label: "Safety", icon: ShieldAlert },
  { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const path = usePathname();
  return (
    <nav className="flex md:flex-col gap-1.5 px-4 py-3 md:p-3 overflow-x-auto md:overflow-visible [scrollbar-width:none]">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = path === href || (href !== "/admin" && path.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 shrink-0 rounded-xl px-3 py-2 text-[13px] font-bold whitespace-nowrap",
              active ? "bg-[var(--primary)] text-white" : "text-[var(--ink)] hover:bg-[var(--tealbg)]"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}