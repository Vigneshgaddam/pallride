"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, KeyRound, Tag, ShieldCheck, ListPlus, User } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/trips", key: "Live Trips", icon: Car },
  { href: "/rentals", key: "Rentals", icon: KeyRound },
  { href: "/cars", key: "Buy & Sell", icon: Tag },
  { href: "/safety", key: "Safety", icon: ShieldCheck },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

export function Header() {
  const { te, toggle } = useLang();
  const t = useT();
  const path = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)] pr-no-print">
      <div className="mx-auto flex w-full max-w-[520px] items-center justify-between gap-3 px-[18px] py-2.5 md:max-w-6xl md:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-xl">
          <img src="/logo.png" alt="PalleRide" width={36} height={36} className="rounded-[10px] object-contain" />
          PalleRide
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {NAV.map(({ href, key, icon: Icon }) => {
            const on = isActive(path, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                  on ? "bg-[var(--tealbg)] text-[var(--primary-hover)]" : "text-[var(--mute)] hover:bg-[var(--tealbg)] hover:text-[var(--ink)]"
                )}
              >
                <Icon size={15} />
                {t(key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Language"
            className="border border-[var(--line)] bg-[var(--card)] rounded-full px-3 py-1.5 text-sm font-semibold cursor-pointer hover:bg-[var(--tealbg)]"
          >
            {te ? "తె | EN" : "EN | తె"}
          </button>
          <Link
            href="/dashboard/trips/new"
            className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[var(--amber)] px-3.5 py-2 text-sm font-extrabold text-[var(--amber-ink)] hover:brightness-95"
          >
            <ListPlus size={16} /> {t("post")}
          </Link>
          <Link
            href="/account"
            aria-label={t("account")}
            className={cn(
              "hidden md:grid place-items-center rounded-full border border-[var(--line)] bg-[var(--card)] p-2 hover:bg-[var(--tealbg)]",
              isActive(path, "/account") && "border-[var(--primary)] text-[var(--primary)]"
            )}
          >
            <User size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
