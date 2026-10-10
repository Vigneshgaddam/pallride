"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Card } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (cfg: {
            client_id: string;
            callback: (resp: { credential?: string }) => void;
          }) => void;
          renderButton: (
            el: HTMLElement,
            opts: { theme?: string; size?: string; width?: number; text?: string; shape?: string },
          ) => void;
        };
      };
    };
  }
}

export default function DriverLoginPage() {
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const { token, hydrate, set } = useDriver();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [p, setP] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [err, setErr] = useState("");
  const googleBtn = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (token) r.replace("/dashboard"); }, [token, r]);

  // Google Sign-In (primary) — rendered only when a client ID is configured.
  useEffect(() => {
    if (!clientId || !googleBtn.current || step !== "phone") return;
    const el = googleBtn.current;
    if (el.childElementCount) return;
    const init = () => {
      window.google?.accounts?.id?.initialize({
        client_id: clientId,
        callback: async (resp) => {
          setErr("");
          if (!resp.credential) return setErr("Google sign-in failed");
          const res = await fetch("/api/driver/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: resp.credential }),
          });
          const d = await res.json();
          if (!res.ok) return setErr(d.error || "Error");
          set({ token: d.token, phone: d.driver.phone || "", name: d.driver.name || "" });
          r.replace(d.needsPhone ? "/driver/onboarding" : "/dashboard");
        },
      });
      window.google?.accounts?.id?.renderButton(el, {
        theme: "outline", size: "large", width: 320, text: "continue_with", shape: "rectangular",
      });
    };
    if (window.google?.accounts?.id) { init(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = init;
    document.head.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, step]);

  const send = async () => {
    setErr("");
    const res = await fetch("/api/driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: p.trim() }),
    });
    const d = await res.json();
    if (!res.ok) return setErr(d.error || "Error");
    setDevOtp(d.devOtp || "");
    setStep("otp");
  };

  const verify = async () => {
    setErr("");
    const res = await fetch("/api/driver", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: p.trim(), otp: otp.trim() }),
    });
    const d = await res.json();
    if (!res.ok) return setErr(d.error || "Error");
    set({ token: d.token, phone: d.driver.phone, name: d.driver.name });
    r.replace("/dashboard");
  };

  return (
    <div className="max-w-[360px] mx-auto pt-8">
      <h1 className="text-xl font-extrabold mb-1">{t("Driver login")}</h1>
      <p className="text-sm text-[var(--mute)] mb-5">
        {te ? "ప్రయాణాలు పోస్ట్ చేయడానికి లాగిన్ అవ్వండి." : "Sign in to post and manage trips."}
      </p>

      {step === "phone" ? (
        <div className="grid gap-2.5">
          {clientId && (
            <>
              <div ref={googleBtn} className="flex justify-center min-h-[44px]" />
              <div className="flex items-center gap-3 text-xs text-[var(--mute)]">
                <span className="flex-1 h-px bg-[var(--line)]" /> {t("or")} <span className="flex-1 h-px bg-[var(--line)]" />
              </div>
            </>
          )}
          <Field label={t("Phone")}>
            <Input type="tel" placeholder={te ? "10 అంకెల నంబర్" : "10-digit number"} value={p} onChange={(e) => setP(e.target.value)} />
          </Field>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <Button onClick={send}>{t("Send OTP")}</Button>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {devOtp && (
            <Card className="!mb-0 bg-[var(--tealbg)]">
              <span className="text-sm font-semibold">{t("dev OTP")}: <b>{devOtp}</b></span>
            </Card>
          )}
          <Field label="OTP">
            <Input inputMode="numeric" placeholder={te ? "OTP నమోదు చేయండి" : "Enter OTP"} value={otp} onChange={(e) => setOtp(e.target.value)} />
          </Field>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <Button onClick={verify}>{t("Verify")}</Button>
          <Button variant="alt" onClick={() => setStep("phone")}>{te ? "వెనుకకు" : "Back"}</Button>
        </div>
      )}
    </div>
  );
}
