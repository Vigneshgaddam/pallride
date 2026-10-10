"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Empty, Button } from "@/components/ui";
import { CarDetails } from "@/components/marketplace/CarDetails";
import { ListingSkeleton } from "@/components/marketplace/ListingSkeleton";
import type { CarDetail } from "@/components/marketplace/WhatsAppEnquiry";
import { useT, useLang } from "@/lib/i18n";

export default function CarPage() {
  const t = useT();
  const { te } = useLang();
  const params = useParams<{ listingId: string }>();
  const listingId = params?.listingId || "";
  const [state, setState] = useState<{ data?: { listing: CarDetail; seller: unknown }; error?: string } | null>(null);

  useEffect(() => {
    if (!listingId) return;
    let alive = true;
    fetch("/api/cars/" + listingId)
      .then(async (r) => {
        const data = await r.json();
        if (!alive) return;
        if (!r.ok) setState({ error: data.error || "Not found" });
        else setState({ data });
      })
      .catch(() => alive && setState({ error: "offline" }));
    return () => { alive = false; };
  }, [listingId]);

  if (!state) return <ListingSkeleton />;

  if (state.error || !state.data)
    return (
      <Empty>
        {state.error === "offline"
          ? te ? "ఇంటర్నెట్ లేదు. కనెక్ట్ అయిన తర్వాత మళ్లీ ప్రయత్నించండి." : "No internet connection. Check and try again."
          : te ? "లిస్టింగ్ కనబడలేదు." : "Listing not found."}
        <div className="h-2" />
        <Button variant="alt" onClick={() => setState(null)}>{t("Try again")}</Button>
      </Empty>
    );

  return <CarDetails car={state.data.listing} seller={state.data.seller as never} />;
}