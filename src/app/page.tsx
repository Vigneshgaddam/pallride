"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Car, KeyRound, MapPin, Search, ShieldCheck, Tag, CalendarDays, Handshake } from "lucide-react";
import type { PublicTrip } from "@/lib/seats";
import type { PublicRental } from "@/lib/rental-search";
import type { PublicCar } from "@/lib/car-search";
import { TripCard } from "@/components/trips/TripCard";
import { RentalCard } from "@/components/rentals/RentalCard";
import { CarCard } from "@/components/marketplace/CarCard";
import { Button, Empty, SectionTitle } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [trips, setTrips] = useState<PublicTrip[]>([]);
  const [rentals, setRentals] = useState<PublicRental[]>([]);
  const [cars, setCars] = useState<PublicCar[]>([]);

  useEffect(() => {
    fetch("/api/trips").then((x) => x.json()).then((d) => setTrips(d.trips || [])).catch(() => {});
    fetch("/api/rentals").then((x) => x.json()).then((d) => setRentals((d.listings || []).slice(0, 3))).catch(() => {});
    fetch("/api/cars").then((x) => x.json()).then((d) => setCars((d.cars || []).slice(0, 3))).catch(() => {});
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (date) p.set("date", date);
    r.push("/trips" + (p.toString() ? "?" + p.toString() : ""));
  };

  // Popular routes grounded in the actual live trip feed (no invented counts).
  const routeCounts = new Map<string, { from: string; to: string; n: number }>();
  for (const tr of trips) {
    const key = tr.from + "→" + tr.to;
    const cur = routeCounts.get(key) || { from: tr.from, to: tr.to, n: 0 };
    cur.n++;
    routeCounts.set(key, cur);
  }
  const popular = [...routeCounts.values()].sort((a, b) => b.n - a.n).slice(0, 4);
  const preview = trips.slice(0, 6);

  const features = [
    { href: "/trips", icon: Car, title: "Find a Ride", sub: "Shared, affordable village rides", chip: "bg-[var(--chip-mint)]" },
    { href: "/rentals", icon: KeyRound, title: "Rent a car", sub: "Cars for a day or a week", chip: "bg-[var(--chip-green)]" },
    { href: "/cars", icon: Tag, title: "Buy & sell", sub: "Used cars from local sellers", chip: "bg-[var(--chip-peach)]" },
  ];

  return (
    <div className="pb-8">
      <section className="relative overflow-hidden rounded-2xl bg-[var(--forest)] text-[var(--forest-ink)] p-6 md:p-10 mb-5">
        <div className="relative max-w-2xl">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight text-white">{t("Your next ride starts here.")}</h1>
          <p className="text-white/85 text-sm md:text-base mt-2.5 max-w-xl">
            <span className="text-[var(--amber)] font-semibold">{t("WhatsApp-first local travel")}</span> — {te ? "పంచుకునే ప్రయాణాలు, అద్దె కార్లు మరియు కొనుగోలు-అమ్మకాలు." : "shared rides, rentals and buy-and-sell across Telangana."}
          </p>

          <form onSubmit={submit} className="mt-5 grid gap-2.5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end bg-[var(--card)] rounded-2xl p-3">
            <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 bg-[var(--card)] focus-within:border-[var(--primary)]">
              <MapPin size={16} className="text-[var(--mute)] shrink-0" />
              <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder={t("From")}
                aria-label={t("From")} className="flex-1 min-w-0 py-3 text-sm bg-transparent outline-none text-[var(--ink)]" />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 bg-[var(--card)] focus-within:border-[var(--primary)]">
              <MapPin size={16} className="text-[var(--mute)] shrink-0" />
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={t("To")}
                aria-label={t("To")} className="flex-1 min-w-0 py-3 text-sm bg-transparent outline-none text-[var(--ink)]" />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 bg-[var(--card)] focus-within:border-[var(--primary)]">
              <CalendarDays size={16} className="text-[var(--mute)] shrink-0" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                aria-label={t("Date")} className="flex-1 min-w-0 py-3 text-sm bg-transparent outline-none text-[var(--ink)]" />
            </label>
            <Button type="submit" className="md:w-auto flex items-center justify-center gap-2">
              <Search size={16} /> {t("Find a Ride")}
            </Button>
          </form>

          <div className="mt-4">
            <Link href="/dashboard/trips/new" className="inline-flex items-center gap-2 text-sm font-bold text-white underline underline-offset-4">
              {t("Post a Trip")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 mb-6">
        {features.map(({ href, icon: Icon, title, sub, chip }) => (
          <Link key={href} href={href}
            className="group bg-[var(--card)] border border-[var(--line)] rounded-2xl p-4 flex items-center gap-3.5 pr-elevate hover:border-[var(--primary)]">
            <span className={cn("rounded-xl p-3 shrink-0", chip)}>
              <Icon size={20} className="text-[var(--forest)]" />
            </span>
            <span className="min-w-0">
              <b className="block text-[15px] font-extrabold">{t(title)}</b>
              <span className="block text-xs text-[var(--mute)] mt-0.5">{t(sub)}</span>
            </span>
            <ArrowRight size={16} className="ml-auto text-[var(--mute)] group-hover:text-[var(--primary)] shrink-0" />
          </Link>
        ))}
      </div>

      {popular.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-[var(--mute)] uppercase tracking-wide mb-2.5">{t("Popular routes")}</h2>
          <div className="flex gap-2 overflow-x-auto pr-scroll-x pb-1">
            {popular.map((p) => (
              <button key={p.from + p.to}
                onClick={() => r.push(`/trips?from=${encodeURIComponent(p.from)}&to=${encodeURIComponent(p.to)}`)}
                className="shrink-0 border border-[var(--line)] bg-[var(--card)] rounded-full px-4 py-2 text-sm font-semibold cursor-pointer hover:border-[var(--primary)]">
                {p.from} → {p.to}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-lg font-bold">{t("Live Trips")}</h2>
        <Link href="/trips" className="text-sm font-semibold text-[var(--primary)] flex items-center gap-1">
          {t("View all")} <ArrowRight size={14} />
        </Link>
      </div>
      {preview.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mb-6">
          {preview.map((trip) => <TripCard key={trip.id} trip={trip} />)}
        </div>
      ) : (
        <Empty>
          {t("No trips yet — be the first to post one.")}
          <div className="h-3" />
          <Link href="/dashboard/trips/new" className="text-sm font-bold text-[var(--primary)]">{t("Post a Trip")} →</Link>
        </Empty>
      )}

      {rentals.length > 0 && (
        <section className="mb-6">
          <SectionTitle action={<Link href="/rentals" className="text-sm font-semibold text-[var(--primary)]">{t("View all")}</Link>}>
            {t("Featured rentals")}
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rentals.map((rn) => <RentalCard key={rn.id} rental={rn} />)}
          </div>
        </section>
      )}

      {cars.length > 0 && (
        <section className="mb-6">
          <SectionTitle action={<Link href="/cars" className="text-sm font-semibold text-[var(--primary)]">{t("View all")}</Link>}>
            {t("Cars for sale")}
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cars.map((c) => <CarCard key={c.id} car={c} />)}
          </div>
        </section>
      )}

      <section className="mb-5">
        <div className="bg-[var(--primary-soft)] rounded-2xl p-5 md:p-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-[var(--card)] p-3 shrink-0">
              <Handshake size={22} className="text-[var(--primary)]" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold">{t("Drive with PalleRide")}</h2>
              <p className="text-sm text-[var(--mute)] mt-1">{t("Earn by sharing your ride or listing a vehicle.")}</p>
            </div>
          </div>
          <div className="flex gap-2.5 md:justify-end">
            <Link href="/auth/login" className="flex-1 md:flex-none"><Button className="!px-5">{t("Get started")}</Button></Link>
            <Link href="/safety" className="flex-1 md:flex-none"><Button variant="alt" className="!px-5">{t("Learn more")}</Button></Link>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-start gap-3 bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5">
          <ShieldCheck size={22} className="text-[var(--primary)] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-extrabold">{t("Trust & safety")}</h2>
            <p className="text-sm text-[var(--mute)] mt-1">{t("Pay only after the driver confirms your seats on WhatsApp. We never ask for documents.")}</p>
            <Link href="/safety" className="text-sm font-bold text-[var(--primary)] mt-2 inline-block">{t("Safety")} →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
