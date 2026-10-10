"use client";
import { useEffect, useState } from "react";
import { Trash2, Pencil, Lock, Snowflake, Fuel, Check } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import { Button, Card, Field, Input, Empty } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";
import { useRequireDriver } from "@/components/trip-form";

const TYPES = ["hatchback", "sedan", "suv", "tempo", "bike"];
const FUELS = ["petrol", "diesel", "cng", "electric"];

export default function VehiclesPage() {
  const t = useT();
  const { te } = useLang();
  const { token, ready } = useRequireDriver();
  const { logout } = useDriver();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editId, setEditId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [f, setF] = useState({
    type: "suv", make: "", model: "", year: "", regNumber: "", seats: "4",
    ac: true, fuel: "petrol", photo: "",
  });

  const load = () => {
    fetch("/api/driver/vehicles", { headers: { Authorization: "Bearer " + token } })
      .then((res) => res.json())
      .then((d) => setVehicles(d.vehicles || []))
      .catch(() => setVehicles([]));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (token) load(); }, [token]);

  if (!ready || !token) return <p className="text-center text-[var(--mute)] py-10">…</p>;

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const save = async () => {
    setErr("");
    setBusy(true);
    const body = {
      type: f.type, make: f.make, model: f.model, year: f.year,
      regNumber: f.regNumber, seats: Number(f.seats), ac: f.ac, fuel: f.fuel,
      photos: f.photo ? [f.photo] : [],
    };
    const res = await fetch(editId ? "/api/driver/vehicles/" + editId : "/api/driver/vehicles", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setBusy(false);
    if (res.status === 401) { logout(); return; }
    if (!res.ok) return setErr(d.error || "Error");
    flash(editId ? t("Vehicle updated") : t("Vehicle added"));
    reset();
    load();
  };

  const remove = async (v: Vehicle) => {
    if (!confirm(t("Delete vehicle") + "?")) return;
    const res = await fetch("/api/driver/vehicles/" + v.id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    if (res.ok) { flash(t("Deleted")); load(); }
  };

  const reset = () => {
    setEditId("");
    setF({ type: "suv", make: "", model: "", year: "", regNumber: "", seats: "4", ac: true, fuel: "petrol", photo: "" });
  };

  const startEdit = (v: Vehicle) => {
    setEditId(v.id);
    setErr("");
    setF({
      type: v.type, make: v.make, model: v.model, year: v.year, regNumber: v.regNumber,
      seats: String(v.seats), ac: v.ac, fuel: v.fuel, photo: v.photos[0] || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="pb-6">
      <h1 className="text-xl font-extrabold mb-1">{t("Vehicle")}</h1>
      <p className="text-sm text-[var(--mute)] mb-4">
        {te ? "మీ వాహన వివరాలు. రిజిస్ట్రేషన్ నంబర్ ఎప్పుడూ పబ్లిక్‌గా కనిపించదు." : "Your vehicle details. Registration number is never shown publicly."}
      </p>

      {vehicles.length > 0 && !editId && (
        vehicles.map((v) => (
          <Card key={v.id}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-extrabold">{v.make} {v.model} · {v.year || "—"}</div>
                <div className="text-[13px] text-[var(--mute)] mt-1 flex items-center gap-1.5 flex-wrap">
                  {v.type.toUpperCase()} · {v.seats} {t("Seats").toLowerCase()} ·
                  {v.ac ? <span className="inline-flex items-center gap-1"><Snowflake size={12} /> AC</span> : t("Non-AC")} ·
                  <span className="inline-flex items-center gap-1"><Fuel size={12} /> {v.fuel}</span>
                </div>
                <div className="text-[13px] mt-1 inline-flex items-center gap-1 text-[var(--mute)]">
                  <Lock size={12} /> {v.regNumber} <span className="text-[10px] font-bold uppercase">({t("private")})</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => startEdit(v)} className="p-2 text-[var(--mute)] cursor-pointer" aria-label="Edit">
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(v)} className="p-2 text-red-600 cursor-pointer" aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </Card>
        ))
      )}

      {vehicles.length === 0 && !editId && (
        <Empty>{te ? "వాహనం జోడించండి." : "No vehicle added yet."}</Empty>
      )}

      {(vehicles.length === 0 || editId) && (
      <>
      <h2 className="text-sm font-bold text-[var(--mute)] uppercase tracking-wide mt-4 mb-2">
        {editId ? t("Edit vehicle") : t("Add vehicle")}
      </h2>
      <div className="grid gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex items-center gap-2.5 border border-[var(--line)] rounded-[14px] px-3 bg-[var(--bg)]">
            <span className="text-xs text-[var(--mute)] w-14 shrink-0 font-semibold">{t("Type")}</span>
            <select value={f.type} onChange={(e) => setF((s) => ({ ...s, type: e.target.value }))}
              className="flex-1 bg-transparent py-3 text-sm outline-none">
              {TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2.5 border border-[var(--line)] rounded-[14px] px-3 bg-[var(--bg)]">
            <span className="text-xs text-[var(--mute)] w-14 shrink-0 font-semibold">{t("Fuel")}</span>
            <select value={f.fuel} onChange={(e) => setF((s) => ({ ...s, fuel: e.target.value }))}
              className="flex-1 bg-transparent py-3 text-sm outline-none">
              {FUELS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t("Make")}><Input placeholder="Maruti Suzuki" value={f.make} onChange={(e) => setF((s) => ({ ...s, make: e.target.value }))} /></Field>
          <Field label={t("Model")}><Input placeholder="Ertiga" value={f.model} onChange={(e) => setF((s) => ({ ...s, model: e.target.value }))} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t("Year")}><Input placeholder="2021" value={f.year} onChange={(e) => setF((s) => ({ ...s, year: e.target.value }))} /></Field>
          <Field label={t("Seats")}><Input type="number" min={1} max={12} value={f.seats} onChange={(e) => setF((s) => ({ ...s, seats: e.target.value }))} /></Field>
        </div>
        <Field label={t("Reg. no")}>
          <Input placeholder="TS01AB1234" value={f.regNumber} onChange={(e) => setF((s) => ({ ...s, regNumber: e.target.value }))} />
        </Field>
        <Field label={t("Photo URL")}>
          <Input placeholder="https://…" value={f.photo} onChange={(e) => setF((s) => ({ ...s, photo: e.target.value }))} />
        </Field>
        <div className="flex gap-2">
          <button
            onClick={() => setF((s) => ({ ...s, ac: !s.ac }))}
            className={"text-xs font-bold rounded-full px-3 py-1.5 border cursor-pointer " +
              (f.ac ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-[var(--card)] text-[var(--mute)] border-[var(--line)]")}
          >
            <span className="inline-flex items-center gap-1">{f.ac && <Check size={13} />}<Snowflake size={13} /> {t("AC")}</span>
          </button>
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="grid grid-cols-2 gap-2.5">
          <Button disabled={busy} onClick={save}>{editId ? t("Save") : t("Add vehicle")}</Button>
          {editId && <Button variant="alt" onClick={reset}>{te ? "రద్దు" : "Cancel"}</Button>}
        </div>
      </div>
      </>
      )}

      {toast && <div className="fixed left-1/2 -translate-x-1/2 top-4 bg-[var(--ink)] text-[var(--bg)] px-4 py-2.5 rounded-[14px] text-sm z-50">{toast}</div>}
    </div>
  );
}
