"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";

// Public footer. Only links to routes that actually exist in the app —
// no invented terms/privacy pages.
export function Footer() {
  const t = useT();
  const links = [
    { href: "/trips", label: t("Live Trips") },
    { href: "/rentals", label: t("Rentals") },
    { href: "/cars", label: t("Buy & Sell") },
    { href: "/safety", label: t("Safety") },
    { href: "/account", label: t("Account") },
  ];
  return (
    <footer className="bg-[var(--forest)] text-[var(--forest-ink)] mt-10 pr-no-print">
      <div className="mx-auto w-full max-w-6xl px-[18px] md:px-8 py-10 grid gap-6 sm:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 font-extrabold text-lg text-white">
            <img src="/logo.png" alt="" width={30} height={30} className="rounded-lg object-contain" />
            PalleRide
          </div>
          <p className="text-sm text-white/70 mt-2 max-w-xs">{t("Local Travel. Simple Booking.")}</p>
          <p className="text-xs text-white/55 mt-3">Telangana, India</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm content-start">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/75 hover:text-white w-fit">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-6xl px-[18px] md:px-8 py-4 text-xs text-white/60">
          © {new Date().getFullYear()} PalleRide · {t("WhatsApp-first local travel")}
        </p>
      </div>
    </footer>
  );
}
