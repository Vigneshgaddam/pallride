"use client";
import { useState } from "react";
import { CheckCircle2, ShieldAlert, X } from "lucide-react";
import { Button, Card, Field, Input, Sheet } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";

const CATS = [
  "unsafe-driving", "harassment", "fake-profile", "scam", "vehicle-details", "spam", "other",
] as const;

const CAT_LABEL: Record<(typeof CATS)[number], { en: string; te?: string }> = {
  "unsafe-driving": { en: "Unsafe driving", te: "భద్రత లేని డ్రైవింగ్" },
  harassment: { en: "Harassment / abuse", te: "వేధింపు / దుర్వినియోగం" },
  "fake-profile": { en: "Fake profile", te: "ఫేక్ ప్రొఫైల్" },
  scam: { en: "Scam / fraud", te: "మోసం" },
  "vehicle-details": { en: "Wrong vehicle details", te: "తప్పు వాహన వివరాలు" },
  spam: { en: "Spam", te: "స్పామ్" },
  other: { en: "Other", te: "ఇతర" },
};

const TARGET_LABEL: Record<string, { en: string; te?: string }> = {
  trip: { en: "a trip", te: "ఒక ట్రిప్" },
  driver: { en: "a driver", te: "ఒక డ్రైవర్" },
  passenger: { en: "a passenger", te: "ఒక ప్రయాణికుడు" },
  vehicle: { en: "a vehicle listing", te: "ఒక వాహన ప్రకటన" },
  other: { en: "something else", te: "ఏదో ఒకటి" },
};

type ReportTargetType = "trip" | "driver" | "passenger" | "vehicle" | "other";

type Props = {
  open: boolean;
  onClose: () => void;
  targetType?: ReportTargetType;
  targetId?: string;
  targetPhone?: string;
  fromPhone?: string;
};

type Status = "idle" | "submitting" | "done" | "failed";

// ReportDialog — offline-friendly: uses a clientRef idempotency key so a retry
// on a slow network never creates a duplicate report, and only shows success
// after the server confirms the report was stored.
export function ReportDialog({ open, onClose, targetType = "other", targetId, targetPhone, fromPhone = "" }: Props) {
  const t = useT();
  const { te } = useLang();
  const [status, setStatus] = useState<Status>("idle");
  const [category, setCategory] = useState<(typeof CATS)[number]>("other");
  const [details, setDetails] = useState("");
  const [phone, setPhone] = useState(fromPhone);
  const [block, setBlock] = useState(false);
  const [clientRef, setClientRef] = useState("");
  const [err, setErr] = useState("");
  const [prev, setPrev] = useState({ open: false, from: fromPhone });

  // Render-phase reset whenever the dialog is (re)opened with a phone change
  if (prev.open !== open || prev.from !== fromPhone) {
    setPrev({ open, from: fromPhone });
    setStatus("idle");
    setCategory("other");
    setDetails("");
    setPhone(fromPhone);
    setBlock(false);
    setErr("");
  }

  const submit = async () => {
    setErr("");
    if (!details.trim()) return setErr(te ? "ఏం జరిగిందో వివరించండి" : "Describe what happened");
    if (!/^\d{10}$/.test(phone.replace(/\D/g, "").slice(-10)))
      return setErr(te ? "10 అంకెల ఫోన్ నంబర్ అవసరం" : "Add a 10-digit phone number");
    // Idempotency key: generated on first submit, reused on every retry so a
    // slow network can never create a duplicate report.
    const ref = clientRef || (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2));
    setClientRef(ref);
    setStatus("submitting");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRef: ref, category, details,
          targetType, targetId: targetId || "",
          phone: phone.replace(/\D/g, "").slice(-10),
          blockPhone: block ? targetPhone : "",
        }),
      });
      const d = await res.json();
      if (!res.ok || !d.report) {
        setErr(d.error || "Could not submit");
        setStatus("failed");
        return;
      }
      setStatus("done");
    } catch {
      setErr(te ? "సర్వర్ కన్ఫర్మ్ చేయలేదు. మళ్లీ ప్రయత్నించండి." : "The server did not confirm. Retry.");
      setStatus("failed");
    }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <h2 className="text-lg font-extrabold flex items-center gap-2">
          <ShieldAlert size={18} className="text-red-500" /> {t("Report problem")}
        </h2>
        <button onClick={onClose} aria-label={t("Close")} className="text-[var(--mute)]"><X size={18} /></button>
      </div>

      {status === "done" ? (
        <Card className="!border-[var(--primary)] text-center">
          <CheckCircle2 size={28} className="text-[var(--primary)] mx-auto" />
          <div className="font-extrabold mt-1">{t("Report submitted")}</div>
          <p className="text-xs text-[var(--mute)] mt-1">{t("Our team reviews every report")}</p>
          <div className="h-2" />
          <Button onClick={onClose}>{t("Close")}</Button>
        </Card>
      ) : (
        <>
          <p className="text-xs text-[var(--mute)] mb-3">
            {t("Reporting")} {TARGET_LABEL[targetType]?.en}: {targetId || "—"}
          </p>
          <div className="text-sm font-bold mb-1.5">{t("Reason")}</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {CATS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={
                  "px-3 py-1.5 rounded-[12px] text-xs font-bold border transition-colors " +
                  (category === c ? "bg-[var(--ink)] text-[var(--bg)] border-transparent" : "bg-[var(--card)] border-[var(--line)]")
                }
              >
                {te ? CAT_LABEL[c].te : CAT_LABEL[c].en}
              </button>
            ))}
          </div>
          <Field label={t("Details")}>
            <Input placeholder={te ? "ఏం జరిగింది?" : "What happened?"} value={details} onChange={(e) => setDetails(e.target.value)} />
          </Field>
          <div className="h-2" />
          <Field label={t("Phone")}>
            <Input type="tel" placeholder={te ? "10 అంకెల నంబర్" : "10-digit number"} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>

          {targetPhone && fromPhone && targetPhone !== fromPhone && (
            <label className="flex items-center gap-2 mt-3 text-sm font-semibold cursor-pointer">
              <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} className="accent-[var(--primary)] w-4 h-4" />
              {t("Also block this contact")}
            </label>
          )}

          {err && <p className="text-red-600 text-sm mt-2.5">{err}</p>}
          <div className="h-3" />
          {status === "failed" ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="alt" onClick={onClose}>{t("Close")}</Button>
              <Button onClick={submit}>{t("Retry")}</Button>
            </div>
          ) : (
            <Button disabled={status === "submitting"} onClick={submit}>
              {status === "submitting" ? t("Sending…") : t("Submit report")}
            </Button>
          )}
          <p className="text-[11px] text-[var(--mute)] mt-2 text-center">{t("Your report is kept confidential")}</p>
        </>
      )}
    </Sheet>
  );
}