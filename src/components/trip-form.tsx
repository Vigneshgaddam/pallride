"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check, Car, Snowflake, Briefcase, StickyNote } from "lucide-react";
import { Button, Field, Input, Card } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";
import { whenLabel, fmtTime, priceLabel } from "@/lib/utils";

export type TripFormValues = {
  from: string; to: string; stops: string[]; date: string; time: string;
  priceLo: string; seatsTotal: string; car: string;
  ac: boolean; luggage: boolean; notes: string;
};

export function emptyTrip(): TripFormValues {
  return { from: "", to: "", stops: [], date: "", time: "", priceLo: "", seatsTotal: "6", car: "", ac: true, luggage: false, notes: "" };
}

// Spec §8: extremely short form — From, To, Stops, Date, Time, Vehicle, Seats, Price.
export function TripForm({
  initial, submitLabel, onSubmit, showPreview = true, canSaveDraft = true,
}: {
  initial: TripFormValues;
  submitLabel: string;
  onSubmit: (v: TripFormValues, publish: boolean) => Promise<string>;
  showPreview?: boolean;
  canSaveDraft?: boolean;
}) {
  const t = useT();
  const { te } = useLang();
  const [v, setV] = useState(initial);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const set = (k: keyof TripFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));
  const setStop = (i: number, val: string) =>
    setV((s) => ({ ...s, stops: s.stops.map((x, j) => (j === i ? val : x)) }));
  const toggleQuickStop = (name: string) =>
    setV((s) => ({
      ...s,
      stops: s.stops.includes(name) ? s.stops.filter((x) => x !== name) : [...s.stops, name],
    }));

  const go = async (publish: boolean) => {
    setBusy(true);
    setErr(await onSubmit({ ...v, stops: v.stops.map((s) => s.trim()).filter(Boolean) }, publish));
    setBusy(false);
  };

  return (
    <div className="grid gap-2.5">
      <Field label={t("From")}>
        <Input placeholder={te ? "ఎక్కడ మొదలు?" : "Where are you starting?"} value={v.from} onChange={set("from")} />
      </Field>
      <Field label={t("To")}>
        <Input placeholder={te ? "ఎక్కడికి?" : "Where are you going?"} value={v.to} onChange={set("to")} />
      </Field>

      {v.stops.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-6 h-6 shrink-0 rounded-full bg-[var(--tealbg)] grid place-items-center text-[11px] font-bold">{i + 1}</span>
          <div className="flex-1">
            <Field label={t("Stops")}>
              <Input placeholder={te ? "స్టాప్" : "Via point"} value={s} onChange={(e) => setStop(i, e.target.value)} />
            </Field>
          </div>
          <button
            onClick={() => setV((x) => ({ ...x, stops: x.stops.filter((_, j) => j !== i) }))}
            className="p-2 text-[var(--mute)] cursor-pointer"
            aria-label="Remove stop"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      {v.stops.length < 8 && (
        <button
          onClick={() => setV((x) => ({ ...x, stops: [...x.stops, ""] }))}
          className="flex items-center gap-1.5 text-sm font-bold text-[var(--primary)] cursor-pointer w-fit"
        >
          <Plus size={15} /> {t("Add stop")}
        </button>
      )}
      <div className="flex gap-2">
        {["JBS", "Airport"].map((q) => (
          <button
            key={q}
            onClick={() => toggleQuickStop(q)}
            className={
              "text-xs font-bold rounded-full px-3 py-1.5 border cursor-pointer " +
              (v.stops.includes(q)
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-[var(--card)] text-[var(--mute)] border-[var(--line)]")
            }
          >
            {q === "JBS" ? t("JBS stop") : t("Airport stop")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label={t("Date")}><Input type="date" value={v.date} onChange={set("date")} /></Field>
        <Field label={te ? "సమయం" : "Time"}><Input type="time" value={v.time} onChange={set("time")} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label={`${t("Price")}/seat`}>
          <Input type="number" placeholder="₹" value={v.priceLo} onChange={set("priceLo")} />
        </Field>
        <Field label={t("Seats")}>
          <Input type="number" min={1} max={12} value={v.seatsTotal} onChange={set("seatsTotal")} />
        </Field>
      </div>
      <Field label={t("Vehicle")}>
        <Input placeholder="Ertiga · AC" value={v.car} onChange={set("car")} />
      </Field>

      <div className="flex gap-2">
        {([
          ["ac", t("AC")],
          ["luggage", t("Luggage space")],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setV((s) => ({ ...s, [k]: !s[k] }))}
            className={
              "inline-flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1.5 border cursor-pointer " +
              (v[k] ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-[var(--card)] text-[var(--mute)] border-[var(--line)]")
            }
          >
            {v[k] && <Check size={13} />}{label}
          </button>
        ))}
      </div>
      <Field label={t("Notes")}>
        <Input placeholder={te ? "ప్యాసింజర్లకు గమనిక" : "Note for passengers"} value={v.notes} onChange={set("notes")} />
      </Field>

      {preview && (
        <Card className="!mb-0">
          <div className="font-bold">{[v.from, ...v.stops.filter(Boolean), v.to].join(" → ") || "…"}</div>
          <div className="text-[13px] text-[var(--mute)] mt-1">
            {v.date ? whenLabel(v.date) : "—"} · {v.time ? fmtTime(v.time) : "—"}
          </div>
          <div className="text-sm mt-1 font-semibold text-[var(--primary)]">
            {v.priceLo ? priceLabel(+v.priceLo, +v.priceLo) : "₹—"} / {t("Seat").toLowerCase()} · {v.seatsTotal} {t("Seats").toLowerCase()}
          </div>
          {v.car && <div className="text-[13px] text-[var(--mute)] mt-1 inline-flex items-center gap-1.5"><Car size={13} /> {v.car}</div>}
          <div className="text-[13px] text-[var(--mute)] mt-1 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1">{v.ac ? <><Snowflake size={13} /> {t("AC")}</> : t("Non-AC")}</span> ·
            <span className="inline-flex items-center gap-1">{v.luggage ? <><Briefcase size={13} /> {t("Luggage space")}</> : t("No luggage space")}</span>
          </div>
          {v.notes && <div className="text-[13px] text-[var(--mute)] mt-1 inline-flex items-center gap-1.5"><StickyNote size={13} /> {v.notes}</div>}
        </Card>
      )}

      {err && <p className="text-red-600 text-sm">{err}</p>}

      {showPreview && (
        <Button variant="alt" onClick={() => setPreview((p) => !p)}>
          {preview ? (te ? "ఎడిట్" : "Edit") : t("Preview")}
        </Button>
      )}
      <Button disabled={busy} onClick={() => go(true)}>{submitLabel}</Button>
      {canSaveDraft && (
        <Button variant="alt" disabled={busy} onClick={() => go(false)}>{t("Save draft")}</Button>
      )}
    </div>
  );
}

export function useRequireDriver() {
  const { token, hydrate } = useDriver();
  const r = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mark mounted to avoid SSR mismatch
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (ready && !token) r.replace("/auth/login");
  }, [ready, token, r]);
  return { token, ready };
}
