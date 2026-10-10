"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Empty, Button } from "@/components/ui";
import { SellVehicleForm } from "@/components/marketplace/SellVehicleForm";
import { useT, useLang } from "@/lib/i18n";
import { useRequireDriver } from "@/components/trip-form";
import type { CarListing } from "@/lib/types";

export default function EditCarListingPage() {
  const t = useT();
  const { te } = useLang();
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const { token, ready } = useRequireDriver();
  const [listing, setListing] = useState<CarListing | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!ready || !token || !id) return;
    let alive = true;
    fetch("/api/driver/cars", { headers: { Authorization: "Bearer " + token } })
      .then(async (r) => {
        const data = await r.json();
        if (!alive) return;
        if (!r.ok) throw new Error(data.error || "Could not load listing");
        const mine = (data.listings as CarListing[]).find((l) => l.id === id);
        if (!mine) throw new Error("You can only edit your own listings");
        setListing(mine);
      })
      .catch((e) => alive && setErr((e as Error).message));
    return () => { alive = false; };
  }, [ready, token, id]);

  if (!ready) return null;

  if (err || !listing)
    return (
      <Empty>
        {err || (te ? "లిస్టింగ్ కనబడలేదు." : "Listing not found.")}
        <div className="h-2" />
        <Button variant="alt" onClick={() => setListing(null)}>{t("Try again")}</Button>
      </Empty>
    );

  return <SellVehicleForm listing={listing} />;
}