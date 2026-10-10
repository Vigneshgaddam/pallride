"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, AlertTriangle, Car, User } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";
import { useRequireDriver } from "@/components/trip-form";

type State = {
  verification: string;
  status: string;
  ready: { profile: boolean; vehicle: boolean };
  vehicle: { model: string; regNumber: string } | null;
};

export default function VerificationPage() {
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const { token, ready } = useRequireDriver();
  const { logout } = useDriver();
  const [s, setS] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    if (!token) return;
    fetch("/api/driver/verification", { headers: { Authorization: "Bearer " + token } })
      .then((res) => res.json())
      .then((d) => { if (d.verification) setS(d); })
      .catch(() => {});
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (!ready || !token) return <p className="text-center text-[var(--mute)] py-10">…</p>;
  if (!s) return <p className="text-center text-[var(--mute)] py-10">…</p>;

  const submit = async () => {
    setErr("");
    setBusy(true);
    const res = await fetch("/api/driver/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    });
    const d = await res.json();
    setBusy(false);
    if (res.status === 401) { logout(); r.replace("/auth/login"); return; }
    if (!res.ok) return setErr(d.error || "Error");
    setToast(te ? "సమీక్షకు పంపబడింది" : "Submitted for review");
    setTimeout(() => setToast(""), 2500);
    load();
  };

  const current =
    s.verification === "approved" ? "approved" :
    s.verification === "under_review" || s.verification === "pending" ? "under_review" :
    s.verification === "changes_required" ? "changes" : "none";

  const stepIndex = current === "approved" ? 2 : current === "under_review" ? 1 : 0;

  return (
    <div className="max-w-[420px] mx-auto pb-6">
      <div className="pt-6 mb-4">
        <div className="text-xs font-bold text-[var(--mute)] uppercase tracking-wide mb-1">{t("Step")} 3 / 3</div>
        <h1 className="text-xl font-extrabold">{t("Verification")}</h1>
        <p className="text-sm text-[var(--mute)] mt-1">
          {te ? "ధృవీకరణ పూర్తయిన తర్వాత Verified Driver గుర్తు వస్తుంది." : "Get the Verified Driver badge after review."}
        </p>
      </div>

      {/* Status timeline */}
      <Card>
        <div className="flex items-center justify-between">
          {(["pending", "under_review", "approved"] as const).map((step, i) => {
            const active = i <= stepIndex;
            const Icon = i === 0 ? Clock : i === 1 ? Clock : CheckCircle2;
            return (
              <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={"w-9 h-9 rounded-full grid place-items-center " + (active ? "bg-[var(--primary)] text-white" : "bg-[var(--bg)] text-[var(--mute)]")}>
                  <Icon size={16} />
                </div>
                <span className="text-[10px] font-bold text-center leading-tight">
                  {step === "pending" ? "PENDING" : step === "under_review" ? "UNDER REVIEW" : "APPROVED"}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {current === "changes" && (
        <Card className="bg-[var(--amber)]/20 !border-[var(--amber)]">
          <div className="flex items-start gap-2 text-sm font-semibold text-[var(--amber-ink)]">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              {t("Changes required")} — {te ? "మీ వివరాలను సవరించి మళ్ళీ సమర్పించండి." : "Update your details and submit again."}
              <div className="flex gap-2 mt-2">
                <Link href="/dashboard/profile" className="underline font-bold">{t("Profile")}</Link>
                <Link href="/dashboard/vehicles" className="underline font-bold">{t("Vehicle")}</Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {current === "none" && (
        <div className="grid gap-2.5">
          <div className="grid gap-2">
            <div className={"flex items-center gap-2 text-sm font-semibold " + (s.ready.profile ? "text-[var(--primary)]" : "text-[var(--mute)]")}>
              {s.ready.profile ? <CheckCircle2 size={16} /> : <User size={16} />} {t("Profile complete")}
              {!s.ready.profile && <Link href="/driver/onboarding" className="underline ml-auto text-[var(--primary)]">{t("Finish")}</Link>}
            </div>
            <div className={"flex items-center gap-2 text-sm font-semibold " + (s.ready.vehicle ? "text-[var(--primary)]" : "text-[var(--mute)]")}>
              {s.ready.vehicle ? <CheckCircle2 size={16} /> : <Car size={16} />} {t("Vehicle added")}
              {!s.ready.vehicle && <Link href="/dashboard/vehicles" className="underline ml-auto text-[var(--primary)]">{t("Add vehicle")}</Link>}
            </div>
          </div>
          {s.vehicle && (
            <p className="text-xs text-[var(--mute)] inline-flex items-center gap-1.5"><Car size={13} /> {s.vehicle.model} · <span className="font-semibold">{s.vehicle.regNumber}</span></p>
          )}
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <Button disabled={busy} onClick={submit}>{t("Submit for review")}</Button>
        </div>
      )}

      {current === "under_review" && (
        <Card className="text-center">
          <Clock size={26} className="mx-auto text-[var(--amber)]" />
          <div className="font-extrabold mt-2">{t("Verification under review")}</div>
          <p className="text-sm text-[var(--mute)] mt-1">
            {te ? "మేము త్వరలో సమీక్షిస్తాము. WhatsApp ద్వారా సమాచారం వస్తుంది." : "We will review shortly and update you."}
          </p>
        </Card>
      )}

      {current === "approved" && (
        <Card className="text-center !border-[var(--primary)]">
          <CheckCircle2 size={26} className="mx-auto text-[var(--primary)]" />
          <div className="font-extrabold mt-2 text-[var(--primary)]">{t("Verified Driver")}</div>
          <p className="text-sm text-[var(--mute)] mt-1">{te ? "మీ ఖాతా ధృవీకరించబడింది." : "Your account is verified."}</p>
        </Card>
      )}

      <div className="mt-4">
        <Link href="/dashboard"><Button variant="alt">{te ? "డాష్‌బోర్డ్" : "Go to dashboard"}</Button></Link>
      </div>

      {toast && <div className="fixed left-1/2 -translate-x-1/2 top-4 bg-[var(--ink)] text-[var(--bg)] px-4 py-2.5 rounded-[14px] text-sm z-50">{toast}</div>}
    </div>
  );
}
