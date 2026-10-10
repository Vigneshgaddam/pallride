"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";
import { useRequireDriver } from "@/components/trip-form";

// Journey step 2: create the driver profile (name, phone, photo, about, service areas).
export default function OnboardingPage() {
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const { token, ready } = useRequireDriver();
  const { set, logout } = useDriver();
  const [f, setF] = useState({ name: "", phone: "", photo: "", about: "", areas: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/driver", { headers: { Authorization: "Bearer " + token } })
      .then((res) => res.json())
      .then((d) => {
        if (!d.driver) return;
        setF((s) => ({
          ...s,
          name: d.driver.name || "",
          phone: d.driver.phone || "",
          photo: d.driver.photo || "",
          about: d.driver.about || "",
          areas: (d.driver.serviceAreas || []).join(", "),
        }));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [token]);

  if (!ready || !token) return <p className="text-center text-[var(--mute)] py-10">…</p>;

  const save = async () => {
    setErr("");
    if (!f.name.trim()) return setErr(te ? "పేరు అవసరం" : "Name is required");
    if (!f.phone.trim() || !/^\d{10}$/.test(f.phone.trim()))
      return setErr(te ? "10 అంకెల ఫోన్ నంబర్ అవసరం" : "A 10-digit phone number is required");
    setBusy(true);
    const res = await fetch("/api/driver", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({
        name: f.name.trim(), phone: f.phone.trim(), photo: f.photo.trim(), about: f.about.trim(),
        serviceAreas: f.areas.split(",").map((x) => x.trim()).filter(Boolean),
      }),
    });
    const d = await res.json();
    setBusy(false);
    if (res.status === 401) { logout(); r.replace("/auth/login"); return; }
    if (!res.ok) return setErr(d.error || "Error");
    if (d.driver) set({ name: d.driver.name, phone: d.driver.phone });
    r.push("/dashboard/vehicles");
  };

  return (
    <div className="max-w-[420px] mx-auto pb-6">
      <div className="pt-6 mb-4">
        <div className="text-xs font-bold text-[var(--mute)] uppercase tracking-wide mb-1">{t("Step")} 1 / 3</div>
        <h1 className="text-xl font-extrabold">{t("Create your driver profile")}</h1>
        <p className="text-sm text-[var(--mute)] mt-1">
          {te ? "ప్యాసింజర్లు మిమ్మల్ని నమ్మేందుకు ఈ వివరాలు అవసరం." : "Passengers see this on every trip."}
        </p>
      </div>

      {!loaded ? (
        <p className="text-center text-[var(--mute)] py-6">…</p>
      ) : (
        <div className="grid gap-2.5">
          <Field label={t("Name")}><Input placeholder="Ramesh Kumar" value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} /></Field>
          <Field label={t("Phone")}>
            <Input type="tel" placeholder={te ? "10 అంకెల నంబర్" : "10-digit number"} value={f.phone} onChange={(e) => setF((s) => ({ ...s, phone: e.target.value }))} />
          </Field>
          <Field label={t("Photo URL")}><Input placeholder="https://…" value={f.photo} onChange={(e) => setF((s) => ({ ...s, photo: e.target.value }))} /></Field>
          <Field label={t("About")}><Input placeholder={te ? "మీ గురించి కొన్ని విషయాలు" : "A few words about you"} value={f.about} onChange={(e) => setF((s) => ({ ...s, about: e.target.value }))} /></Field>
          <Field label={t("Areas")}>
            <Input placeholder="Korutla, Armoor, Hyderabad" value={f.areas} onChange={(e) => setF((s) => ({ ...s, areas: e.target.value }))} />
          </Field>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <Button disabled={busy} onClick={save}>{te ? "కొనసాగించండి" : "Continue"}</Button>
        </div>
      )}

      <Card className="mt-4 !mb-0 bg-[var(--tealbg)]">
        <div className="text-xs font-semibold text-[var(--brand,var(--primary-hover))]">
          {t("Step")} 1 → {t("Vehicle")} → {t("Verification")} ·{" "}
          <Link href="/dashboard" className="underline">{te ? "తర్వాత" : "Skip"}</Link>
        </div>
      </Card>
    </div>
  );
}
