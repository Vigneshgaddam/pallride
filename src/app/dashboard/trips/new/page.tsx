"use client";
import { useRouter } from "next/navigation";
import { TripForm, emptyTrip, useRequireDriver, type TripFormValues } from "@/components/trip-form";
import { useT } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";

export default function NewTripPage() {
  const t = useT();
  const r = useRouter();
  const { token, ready } = useRequireDriver();
  const { phone, name } = useDriver();

  if (!ready || !token) return <p className="text-center text-[var(--mute)] py-10">…</p>;

  const submit = async (v: TripFormValues, publish: boolean) => {
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...v, priceHi: v.priceLo, publish }),
    });
    const d = await res.json();
    if (!res.ok) return d.error || "Error";
    r.push("/dashboard/trips");
    return "";
  };

  return (
    <div className="pb-6">
      <h1 className="text-xl font-extrabold mb-1">{t("Post a trip")}</h1>
      <p className="text-sm text-[var(--mute)] mb-4">{t("Passengers book seats and message you on WhatsApp.")}</p>
      <TripForm initial={emptyTrip()} submitLabel={t("Publish trip")} onSubmit={submit} />
      <p className="text-xs text-[var(--mute)] mt-3">{name} · +91 {phone}</p>
    </div>
  );
}
