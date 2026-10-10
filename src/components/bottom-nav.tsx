"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, KeyRound, Tag, User, Home, ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const tabs = [
  { href: "/", label: "home", icon: Home },
  { href: "/trips", label: "rides", icon: Car },
  { href: "/rentals", label: "rent", icon: KeyRound },
  { href: "/cars", label: "buy", icon: Tag },
  { href: "/account", label: "account", icon: User },
];

export function BottomNav() {
  const p = usePathname();
  const t = useT();
  return (
    <>
      <Link
        href="/dashboard/trips/new"
        aria-label="Post"
        className="md:hidden fixed right-[max(18px,calc(50%-242px))] bottom-[calc(64px+env(safe-area-inset-bottom))] bg-[var(--amber)] text-[var(--amber-ink)] rounded-full p-3.5 shadow-[0_6px_18px_rgba(0,0,0,.25)] z-40 pr-no-print"
      >
        <ListPlus size={22} />
      </Link>
      <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[520px] bg-[var(--card)] border-t border-[var(--line)] flex z-40 pb-[env(safe-area-inset-bottom)] pr-no-print">
        {tabs.map(({ href, label, icon: Icon }) => {
          const on = href === "/" ? p === "/" : p === href || p.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
                on ? "text-[var(--primary)]" : "text-[var(--mute)]"
              )}
            >
              <Icon size={20} />
              {t(label)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
