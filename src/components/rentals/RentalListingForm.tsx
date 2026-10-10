"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Field, Input, Button } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import type { RentalListing } from "@/lib/types";
import { useRequireDriver } from "@/components/trip-form";
import { RentalCard } from "./RentalCard";

type Shape = {
  make: string; model: string; year: string;
  photos: string;
  location: string; seats: string; ac: boolean; pricePerDay: string;
  availableFrom: string; availableTo: string;
  description: string; conditions: string;
};

const empty = (): Shape => ({
  make: "", model: "", year: "", photos: "", location: "", seats: "6", ac: true,
  pricePerDay: "", availableFrom: "", availableTo: "", description: "", conditions: "",
});

function toShape(l: RentalListing): Shape {
  return {
    make: l.make, model: l.model, year: l.year,
    photos: (l.photos || []).join("\n"),
    location: l.location, seats: String(l.seats), ac: l.ac, pricePerDay: String(l.pricePerDay || ""),
    availableFrom: l.availableFrom, availableTo: l.availableTo,
    description: l.description, conditions: l.conditions,
  };
}

// Create + edit owner listing. Drafts can be published here; edits keep the status.
export function RentalListingForm({ listing }: { listing?: RentalListing }) {
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const { token, ready } = useRequireDriver();
  const [f, setF] = useState<Shape>(listing ? toShape(listing) : empty());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");

  const set = (patch: Partial<Shape>) => setF((p) => ({ ...p, ...patch }));
  const photos = f.photos.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 8);
  const premium = Number(f.pricePerDay) > 0;

  const body = () => ({ ...f, photos, seats: Number(f.seats) || 0, pricePerDay: Number(f.pricePerDay) || 0 });

  const create = async (publish: boolean) => {
    setBusy(true); setErr(""); setDone("");
    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body(), token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save listing");
      if (publish) {
        const p2 = await fetch("/api/rentals/" + data.listing.id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action: "publish" }),
        });
        const d2 = await p2.json();
        if (!p2.ok) throw new Error(d2.error || "Could not publish listing");
      }
      setDone(publish ? (te ? "లిస్టింగ్ ప్రచురించబడింది" : "Listing published") : (te ? "డ్రాఫ్ట్ సేవ్ చేయబడింది" : "Draft saved"));
      setTimeout(() => r.push("/dashboard/rentals"), 900);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const update = async () => {
    if (!listing) return;
    setBusy(true); setErr(""); setDone("");
    try {
      const res = await fetch("/api/rentals/" + listing.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body(), token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save listing");
      setDone(te ? "మార్పులు సేవ్ చేయబడ్డాయి" : "Changes saved");
      setTimeout(() => r.push("/dashboard/rentals"), 900);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  if (!ready) return null;

  const preview: Parameters<typeof RentalCard>[0]["rental"] = {
    id: listing?.id || "preview",
    shareCode: listing?.shareCode || "PREVIEW",
    make: f.make, model: f.model, year: f.year,
    photo: photos[0] || "",
    location: f.location, seats: Number(f.seats) || 0, ac: f.ac,
    pricePerDay: Number(f.pricePerDay) || 0, unit: "day",
    availableFrom: f.availableFrom, availableTo: f.availableTo,
    status: "available", expired: false,
    owner: { name: "You", rating: 0, verified: false },
  };

  const canSubmit = ready && !busy && f.make.trim() && f.location.trim() && premium &&
    f.availableFrom && f.availableTo;

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-3">
        {listing ? t("Edit listing") : t("Add a listing")}
      </h1>

      {listing && (
        <p className="text-xs text-[var(--mute)] mb-3">
          {te ? `ప్రస్తుత స్థితి: ${listing.status}` : `Current status: ${listing.status}`}
        </p>
      )}

      <div className="grid gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={te ? "తయారీ" : "Make"}>
            <Input placeholder="Maruti" value={f.make} onChange={(e) => set({ make: e.target.value })} />
          </Field>
          <Field label={te ? "మోడల్" : "Model"}>
            <Input placeholder="Ertiga" value={f.model} onChange={(e) => set({ model: e.target.value })} />
          </Field>
        </div>
        <Field label={te ? "సంవత్సరం" : "Year"}>
          <Input placeholder="2021" inputMode="numeric" value={f.year} onChange={(e) => set({ year: e.target.value })} />
        </Field>
        <Field label={te ? "చిత్రాలు" : "Photos"}>
          <textarea
            className="border-0 bg-transparent outline-none flex-1 py-2 min-w-0 text-sm resize-none"
            rows={3}
            placeholder={te ? "ఒక్కో లైన్‌లో ఒక ఫోటో లింక్" : "One photo link per line"}
            value={f.photos}
            onChange={(e) => set({ photos: e.target.value })}
          />
        </Field>
        <Field label={te ? "స్థలం" : "Location"}>
          <Input placeholder="Armoor" value={f.location} onChange={(e) => set({ location: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={te ? "సీట్లు" : "Seats"}>
            <Input type="number" min={1} max={12} value={f.seats} onChange={(e) => set({ seats: e.target.value })} />
          </Field>
          <Field label={te ? "రోజుకు ₹" : "₹ per day"}>
            <Input type="number" min={1} inputMode="numeric" placeholder="2200" value={f.pricePerDay} onChange={(e) => set({ pricePerDay: e.target.value })} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold cursor-pointer px-1 py-1">
          <input type="checkbox" checked={f.ac} onChange={(e) => set({ ac: e.target.checked })} className="accent-[var(--primary)]" />
          AC {t("available")}
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={te ? "నుండి" : "From"}>
            <Input type="date" value={f.availableFrom} onChange={(e) => set({ availableFrom: e.target.value })} />
          </Field>
          <Field label={te ? "వరకు" : "To"}>
            <Input type="date" min={f.availableFrom} value={f.availableTo} onChange={(e) => set({ availableTo: e.target.value })} />
          </Field>
        </div>
        <Field label={te ? "వివరణ" : "Details"}>
          <textarea
            className="border-0 bg-transparent outline-none flex-1 py-2 min-w-0 text-sm resize-none"
            rows={3}
            placeholder={te ? "కారుపై సమాచారం (ఐచ్ఛికం)" : "About the vehicle (optional)"}
            value={f.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </Field>
        <Field label={te ? "షరతులు" : "Terms"}>
          <textarea
            className="border-0 bg-transparent outline-none flex-1 py-2 min-w-0 text-sm resize-none"
            rows={2}
            placeholder={te ? "ఉదా: ఇంధనం అదనం" : "e.g. fuel extra, deposit"}
            value={f.conditions}
            onChange={(e) => set({ conditions: e.target.value })}
          />
        </Field>
      </div>

      {err && <p className="text-xs text-red-600 font-semibold mt-2.5">{err}</p>}
      {done && <p className="flex items-center gap-1.5 text-xs text-[var(--primary-hover)] font-semibold mt-2.5"><CheckCircle2 size={14} /> {done}</p>}

      <div className="mt-4">
        <b className="text-sm">{t("Preview")}</b>
        <div className="mt-2">
          <RentalCard rental={preview} />
        </div>
      </div>

      <div className="grid gap-2.5 mt-3">
        {listing ? (
          <Button disabled={!canSubmit} onClick={update}>{t("Save changes")}</Button>
        ) : (
          <>
            <Button
              disabled={!canSubmit}
              onClick={() => create(true)}
            >{busy ? te ? "సేవ్ అవుతోంది..." : "Working..." : t("Publish listing")}</Button>
            <Button variant="alt" disabled={busy} onClick={() => create(false)}>
              {busy ? te ? "సేవ్ అవుతోంది..." : "Working..." : t("Save draft")}
            </Button>
          </>
        )}
        <p className="text-xs text-[var(--mute)] text-center">
          {te
            ? "మీ ఫోన్ కేవలం వివరాల పేజీలోనే కనిపిస్తుంది."
            : "Your phone number is only shown to enquirers on the details page."}
        </p>
      </div>
    </div>
  );
}