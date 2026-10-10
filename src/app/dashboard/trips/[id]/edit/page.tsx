"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TripForm, useRequireDriver, type TripFormValues } from "@/components/trip-form";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { useDriver } from "@/lib/driver-store";

export default function EditTripPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const r = useRouter();
  const { token, ready } = useRequireDriver();
  const { logout } = useDriver();
  const [initial, setInitial] = useState<TripFormValues | null>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState(false);

  const load = () => {
    fetch("/api/trips/" + id)
      .then((res) => res.json())
      .then((d) => {
        if (!d.trip) return setError(true);
        setError(false);
        setInitial({
          from: d.trip.from, to: d.trip.to, stops: d.trip.stops || [], date: d.trip.date, time: d.trip.time,
          priceLo: String(d.trip.priceLo),
          seatsTotal: String(d.trip.seatsTotal), car: d.trip.car,
          ac: d.trip.ac !== false, luggage: !!d.trip.luggage, notes: d.trip.notes || "",
        });
      })
      .catch(() => setError(true));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (token) load(); }, [id, token]);

  if (!ready || !token) return <p className="text-center text-[var(--mute)] py-10">…</p>;
  if (error)
    return (
      <div className="py-10 text-center">
        <p className="text-[var(--mute)] mb-3">{t("Could not load. Check connection and retry.")}</p>
        <Button variant="alt" onClick={load}>{t("Retry")}</Button>
      </div>
    );
  if (!initial) return <p className="text-center text-[var(--mute)] py-10">…</p>;

  const submit = async (v: TripFormValues) => {
    const res = await fetch("/api/trips/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...v }),
    });
    const d = await res.json();
    if (res.status === 401) { logout(); r.replace("/auth/login"); return ""; }
    if (!res.ok) return d.error || "Error";
    setToast(t("Trip updated"));
    setTimeout(() => r.push("/dashboard/trips"), 800);
    return "";
  };

  const cancel = async () => {
    if (!confirm(t("Cancel trip") + "?")) return;
    const res = await fetch("/api/trips/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "cancel" }),
    });
    if (res.status === 401) { logout(); r.replace("/auth/login"); return; }
    r.push("/dashboard/trips");
  };

  return (
    <div className="pb-6">
      <h1 className="text-xl font-extrabold mb-4">{t("Edit trip")}</h1>
      <TripForm initial={initial} submitLabel={t("Save")} onSubmit={submit} canSaveDraft={false} />
      <div className="h-3" />
      <Button variant="danger" onClick={cancel}>{t("Cancel trip")}</Button>
      {toast && <div className="fixed left-1/2 -translate-x-1/2 top-4 bg-[var(--ink)] text-[var(--bg)] px-4 py-2.5 rounded-[14px] text-sm z-50">{toast}</div>}
    </div>
  );
}
