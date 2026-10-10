"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Car, LogOut, MapPin, ShieldCheck, Siren, Star } from "lucide-react";
import type { Driver } from "@/lib/types";
import { Button, Card, Field, Input } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";
import { useRequireDriver } from "@/components/trip-form";

export default function DriverProfilePage() {
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const { token, ready } = useRequireDriver();
  const { set, logout } = useDriver();
  const [me, setMe] = useState<Driver | null>(null);
  const [f, setF] = useState({ name: "", phone: "", photo: "", about: "", areas: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch("/api/driver", { headers: { Authorization: "Bearer " + token } })
      .then((res) => res.json())
      .then((d) => {
        if (!d.driver) return;
        setMe(d.driver);
        setF({
          name: d.driver.name || "",
          phone: d.driver.phone || "",
          photo: d.driver.photo || "",
          about: d.driver.about || "",
          areas: (d.driver.serviceAreas || []).join(", "),
        });
      })
      .catch(() => {});
  }, [token]);

  if (!ready || !token) return <p className="text-center text-[var(--mute)] py-10">…</p>;

  const save = async () => {
    setErr("");
    setBusy(true);
    const body: Record<string, unknown> = {
      name: f.name, photo: f.photo, about: f.about,
      serviceAreas: f.areas.split(",").map((s) => s.trim()).filter(Boolean),
    };
    if (me && !me.phone && f.phone) body.phone = f.phone.trim();
    const res = await fetch("/api/driver", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setBusy(false);
    if (res.status === 401) { logout(); r.replace("/auth/login"); return; }
    if (!res.ok) return setErr(d.error || "Error");
    if (d.driver) {
      setMe(d.driver);
      set({ name: d.driver.name, phone: d.driver.phone });
    }
    setToast(t("Profile updated"));
    setTimeout(() => setToast(""), 2000);
  };

  const doLogout = () => { logout(); r.replace("/auth/login"); };

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-extrabold">{t("Profile")}</h1>
        <button onClick={doLogout} className="flex items-center gap-1.5 text-sm font-bold text-red-600 cursor-pointer">
          <LogOut size={15} /> {t("Log out")}
        </button>
      </div>

      {/* Spec profile card */}
      <Card className="text-center">
        {me?.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.photo} alt="" className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-[var(--line)]" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[var(--tealbg)] grid place-items-center text-2xl font-extrabold mx-auto text-[var(--brand,var(--primary-hover))]">
            {(me?.name || "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="font-extrabold text-lg mt-2 flex items-center justify-center gap-1.5">
          {me?.name} {me?.verified && <BadgeCheck size={18} className="text-[var(--primary)]" />}
        </div>
        <div className="text-sm text-[var(--mute)] inline-flex items-center justify-center gap-1.5">
          <Star size={14} className="text-[var(--amber)]" fill="var(--amber)" /> {me?.rating ?? "—"} ({me?.ratingsCount ?? 0} {t("ratings").toLowerCase()})
        </div>
        <div className="text-sm mt-1 inline-flex items-center gap-1.5"><Car size={14} /> {me?.tripsCount ?? 0} {t("completed trips")}</div>
        <div className="text-sm font-bold mt-1">
          {me?.verified
            ? <span className="text-[var(--primary)] inline-flex items-center gap-1"><BadgeCheck size={15} /> {t("Verified Driver")}</span>
            : <span className="text-[var(--amber)]">{t("Not verified")}</span>}
        </div>
        <div className="text-sm text-[var(--mute)] inline-flex items-center gap-1.5"><MapPin size={14} /> {me?.serviceAreas?.join(", ") || "Telangana"}</div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="bg-[var(--bg)] rounded-[14px] py-2">
            <div className="font-extrabold text-sm">{me?.cancellations ?? 0}</div>
            <div className="text-[var(--mute)]">{t("Cancelled")}</div>
          </div>
          <div className="bg-[var(--bg)] rounded-[14px] py-2">
            <div className="font-extrabold text-sm">{me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : "—"}</div>
            <div className="text-[var(--mute)]">{t("Joined")}</div>
          </div>
          <div className="bg-[var(--bg)] rounded-[14px] py-2">
            <div className="font-extrabold text-sm capitalize">{me?.status?.replace("_", " ") || "—"}</div>
            <div className="text-[var(--mute)]">{t("Status")}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Link href="/driver/verification">
            <Button variant="alt" className="!py-2 !text-xs flex items-center justify-center gap-1">
              <ShieldCheck size={14} /> {t("Verification")}
            </Button>
          </Link>
          <Link href="/safety">
            <Button variant="alt" className="!py-2 !text-xs flex items-center justify-center gap-1">
              <Siren size={14} /> {t("Emergency information")}
            </Button>
          </Link>
        </div>
      </Card>

      <h2 className="text-sm font-bold text-[var(--mute)] uppercase tracking-wide mt-4 mb-2">{t("Edit profile")}</h2>
      <div className="grid gap-2.5">
        <Field label={t("Name")}><Input value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} /></Field>
        {!me?.phone && (
          <Field label={t("Phone")}><Input type="tel" value={f.phone} onChange={(e) => setF((s) => ({ ...s, phone: e.target.value }))} /></Field>
        )}
        <Field label={t("Photo URL")}><Input placeholder="https://…" value={f.photo} onChange={(e) => setF((s) => ({ ...s, photo: e.target.value }))} /></Field>
        <Field label={t("About")}><Input placeholder={te ? "మీ గురించి" : "About you"} value={f.about} onChange={(e) => setF((s) => ({ ...s, about: e.target.value }))} /></Field>
        <Field label={t("Areas")}>
          <Input placeholder="Korutla, Armoor, Hyderabad" value={f.areas} onChange={(e) => setF((s) => ({ ...s, areas: e.target.value }))} />
        </Field>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <Button disabled={busy} onClick={save}>{t("Save")}</Button>
      </div>

      {toast && <div className="fixed left-1/2 -translate-x-1/2 top-4 bg-[var(--ink)] text-[var(--bg)] px-4 py-2.5 rounded-[14px] text-sm z-50">{toast}</div>}
    </div>
  );
}
