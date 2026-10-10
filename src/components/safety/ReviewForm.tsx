"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";

const ROWS = ["Driving", "Behaviour", "Punctuality", "Vehicle"] as const;
type RowKey = (typeof ROWS)[number];

function StarRow({ n, onSet, big = false }: { n: number; onSet?: (v: number) => void; big?: boolean }) {
  return (
    <span className={"inline-flex " + (big ? "text-3xl" : "text-lg")}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onSet}
          onClick={() => onSet?.(i)}
          className={(i <= n ? "text-[var(--amber)]" : "text-[var(--line)]") + (onSet ? " cursor-pointer" : " cursor-default")}
          aria-label={`${i} star`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

// ReviewForm: eligible riders rate a completed interaction.
// The server enforces: completed trip only, one review per rider, no self-rating,
// and written feedback is moderated by an admin before going public.
export function ReviewForm({ tripId, onDone }: { tripId: string; onDone?: () => void }) {
  const t = useT();
  const { te } = useLang();
  const [stars, setStars] = useState(0);
  const [rows, setRows] = useState<Record<RowKey, number>>({ Driving: 0, Behaviour: 0, Punctuality: 0, Vehicle: 0 });
  const [comment, setComment] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr("");
    if (!stars) return setErr(te ? "మొత్తం రేటింగ్ ఇవ్వండి" : "Pick an overall rating first");
    if (!/^\d{10}$/.test(phone.trim())) return setErr(te ? "10 అంకెల ఫోన్ నంబర్ అవసరం" : "Enter a 10-digit phone number");
    setBusy(true);
    const res = await fetch(`/api/trips/${tripId}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phone.trim(), stars,
        driving: rows.Driving || stars,
        behaviour: rows.Behaviour || stars,
        punctuality: rows.Punctuality || stars,
        vehicle: rows.Vehicle || stars,
        comment,
      }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(d.error || "Error");
    setDone(true);
    onDone?.();
  };

  if (done)
    return (
      <Card className="text-center !border-[var(--primary)]">
        <CheckCircle2 size={28} className="text-[var(--primary)] mx-auto" />
        <div className="font-extrabold mt-1">{t("Thanks for your rating!")}</div>
      </Card>
    );

  return (
    <Card>
      <div className="font-extrabold mb-1">{t("How was your trip?")}</div>
      <p className="text-xs text-[var(--mute)] mb-2">{t("Your written review is checked before going public")}</p>
      <div className="text-center mb-3">
        <StarRow n={stars} onSet={setStars} big />
        {stars > 0 && <div className="text-xs text-[var(--mute)] font-bold mt-1">{stars} / 5</div>}
      </div>
      <div className="grid gap-1.5 mb-3">
        {ROWS.map((k) => (
          <div key={k} className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{t(k)}</span>
            <StarRow n={rows[k] || stars} onSet={(v) => setRows((s) => ({ ...s, [k]: v }))} />
          </div>
        ))}
      </div>
      <Field label={t("Comment")}>
        <Input placeholder={te ? "మీ అనుభవం" : "Your experience"} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <div className="h-2" />
      <Field label={t("Phone")}>
        <Input type="tel" placeholder={te ? "10 అంకెల నంబర్" : "10-digit number"} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
      <div className="h-2.5" />
      <Button disabled={busy} onClick={submit}>{t("Submit Rating")}</Button>
    </Card>
  );
}