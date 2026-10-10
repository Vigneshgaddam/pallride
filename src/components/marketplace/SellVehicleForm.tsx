"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Field, Input, Button } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import type { CarListing, CarFuel, CarTransmission } from "@/lib/types";
import { validateCar } from "@/lib/validate";
import { useRequireDriver } from "@/components/trip-form";
import type { PublicCar } from "@/lib/car-search";
import { CarCard } from "./CarCard";

type Shape = {
  make: string; model: string; year: string; price: string;
  location: string; fuel: CarFuel; transmission: CarTransmission; odometer: string;
  photos: string; description: string; ownership: string;
};

const empty = (): Shape => ({
  make: "", model: "", year: "", price: "",
  location: "", fuel: "petrol", transmission: "manual", odometer: "",
  photos: "", description: "", ownership: "",
});

function toShape(l: CarListing): Shape {
  return {
    make: l.make, model: l.model, year: l.year, price: String(l.price || ""),
    location: l.location, fuel: l.fuel, transmission: l.transmission,
    odometer: String(l.odometer || ""),
    photos: (l.photos || []).join("\n"),
    description: l.description || "", ownership: l.ownership || "",
  };
}

// Create + edit a used-car listing (spec §6). Drafts can be published here.
export function SellVehicleForm({ listing }: { listing?: CarListing }) {
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

  const body = () => ({
    make: f.make, model: f.model, year: f.year, price: Number(f.price) || 0,
    location: f.location, fuel: f.fuel, transmission: f.transmission,
    odometer: Number(f.odometer) || 0, photos, description: f.description, ownership: f.ownership,
  });

  const create = async (publish: boolean) => {
    setBusy(true); setErr(""); setDone("");
    try {
      const res = await fetch("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body(), token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save listing");
      if (publish) {
        const p2 = await fetch("/api/cars/" + data.listing.id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action: "publish" }),
        });
        const d2 = await p2.json();
        if (!p2.ok) throw new Error(d2.error || "Could not publish listing");
      }
      setDone(publish ? (te ? "లిస్టింగ్ ప్రచురించబడింది" : "Listing published") : (te ? "డ్రాఫ్ట్ సేవ్ చేయబడింది" : "Draft saved"));
      setTimeout(() => r.push("/dashboard/sales"), 900);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  const update = async () => {
    if (!listing) return;
    setBusy(true); setErr(""); setDone("");
    try {
      const res = await fetch("/api/cars/" + listing.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body(), token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save listing");
      setDone(te ? "మార్పులు సేవ్ చేయబడ్డాయి" : "Changes saved");
      setTimeout(() => r.push("/dashboard/sales"), 900);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  if (!ready) return null;

  const preview: PublicCar = {
    id: listing?.id || "preview",
    shareCode: listing?.shareCode || "PREVIEW",
    make: f.make, model: f.model, year: f.year, price: Number(f.price) || 0,
    thumb: photos[0] || "", location: f.location,
    fuel: f.fuel, transmission: f.transmission, odometer: Number(f.odometer) || 0,
    status: "published", expired: false, createdAt: new Date().toISOString(),
    seller: { name: "You", rating: 0, verified: false },
  };

  const errMsg = validateCar(body() as CarListing);
  const canSubmit = ready && !busy && !errMsg;

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-3">
        {listing ? t("Edit listing") : t("Sell your car")}
      </h1>

      {listing && (
        <p className="text-xs text-[var(--mute)] mb-3">
          {te ? `ప్రస్తుత స్థితి: ${listing.status}` : `Current status: ${listing.status}`}
        </p>
      )}

      <div className="grid gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t("Make")}>
            <Input placeholder="Maruti" value={f.make} onChange={(e) => set({ make: e.target.value })} />
          </Field>
          <Field label={t("Model")}>
            <Input placeholder="Swift" value={f.model} onChange={(e) => set({ model: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={te ? "సంవత్సరం" : "Year"}>
            <Input placeholder="2020" inputMode="numeric" value={f.year} onChange={(e) => set({ year: e.target.value })} />
          </Field>
          <Field label={te ? "అపేక్షిత ధర (₹)" : "Expected price (₹)"}>
            <Input type="number" min={1000} inputMode="numeric" placeholder="560000" value={f.price} onChange={(e) => set({ price: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={te ? "ఇంధనం" : "Fuel"}>
            <select
              value={f.fuel}
              onChange={(e) => set({ fuel: e.target.value as CarFuel })}
              className="border-0 bg-transparent outline-none flex-1 py-3 min-w-0 text-sm"
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="cng">CNG</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>
          <Field label={te ? "గేర్‌బాక్స్" : "Gearbox"}>
            <select
              value={f.transmission}
              onChange={(e) => set({ transmission: e.target.value as CarTransmission })}
              className="border-0 bg-transparent outline-none flex-1 py-3 min-w-0 text-sm"
            >
              <option value="manual">{te ? "మాన్యువల్" : "Manual"}</option>
              <option value="automatic">{te ? "ఆటోమాటిక్" : "Automatic"}</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={te ? "మరోమీటరు" : "Odometer (km)"}>
            <Input type="number" min={0} inputMode="numeric" placeholder="35000" value={f.odometer} onChange={(e) => set({ odometer: e.target.value })} />
          </Field>
          <Field label={te ? "కారు స్థలం" : "Car location"}>
            <Input placeholder="Korutla" value={f.location} onChange={(e) => set({ location: e.target.value })} />
          </Field>
        </div>
        <Field label={te ? "ఫోటోలు" : "Photos"}>
          <textarea
            className="border-0 bg-transparent outline-none flex-1 py-2 min-w-0 text-sm resize-none"
            rows={2}
            placeholder={te ? "ఒక్కో లైన్‌లో ఒక ఫోటో లింక్" : "One photo link per line"}
            value={f.photos}
            onChange={(e) => set({ photos: e.target.value })}
          />
        </Field>
        <Field label={te ? "కారు వివరాలు" : "About the car"}>
          <textarea
            className="border-0 bg-transparent outline-none flex-1 py-2 min-w-0 text-sm resize-none"
            rows={3}
            placeholder={te ? "మైలేజ్, కండిషన్, మరమ్మతులు (ఐచ్ఛికం)" : "Mileage, condition, repairs (optional)"}
            value={f.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </Field>
        <Field label={te ? "యజమాన్యం & పత్రాలు" : "Ownership & documents"}>
          <textarea
            className="border-0 bg-transparent outline-none flex-1 py-2 min-w-0 text-sm resize-none"
            rows={2}
            placeholder={te ? "ఉదా: మొదటి యజమాని, 2020 నుండి బీమా" : "e.g. first owner, insured since 2020"}
            value={f.ownership}
            onChange={(e) => set({ ownership: e.target.value })}
          />
        </Field>
        <p className="text-xs text-[var(--mute)] px-1 -mt-1">
          {te
            ? "రిజిస్ట్రేషన్ నంబర్, పత్రాల ఫోటోలు జోడించవద్దు — అవి చాలా వ్యక్తిగతం."
            : "Do not upload registration numbers or document photos — they are too personal."}
        </p>
      </div>

      {errMsg && <p className="text-xs text-red-600 font-semibold mt-2.5">{errMsg}</p>}
      {err && <p className="text-xs text-red-600 font-semibold mt-2.5">{err}</p>}
      {done && <p className="flex items-center gap-1.5 text-xs text-[var(--primary-hover)] font-semibold mt-2.5"><CheckCircle2 size={14} /> {done}</p>}

      <div className="mt-4">
        <b className="text-sm">{t("Preview")}</b>
        <div className="mt-2">
          <CarCard car={preview} />
        </div>
      </div>

      <div className="grid gap-2.5 mt-3">
        {listing ? (
          <Button disabled={!canSubmit} onClick={update}>{t("Save changes")}</Button>
        ) : (
          <>
            <Button disabled={!canSubmit} onClick={() => create(true)}>
              {busy ? te ? "సేవ్ అవుతోంది..." : "Working..." : t("Publish listing")}
            </Button>
            <Button variant="alt" disabled={busy} onClick={() => create(false)}>
              {busy ? te ? "సేవ్ అవుతోంది..." : "Working..." : t("Save draft")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}