"use client";
import { useEffect, useState } from "react";
import { Card, Empty } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useRequireDriver } from "@/components/trip-form";

type MyRating = {
  id: string; stars: number; driving: number; behaviour: number;
  punctuality: number; vehicle: number; comment: string; route: string; date: string; createdAt: string;
  reviewStatus?: string;
};

function Stars({ n }: { n: number }) {
  return (
    <span className="text-[var(--amber)]">
      {[1, 2, 3, 4, 5].map((i) => (i <= n ? "★" : "☆")).join("")}
    </span>
  );
}

export default function DriverRatingsPage() {
  const t = useT();
  const { te } = useLang();
  const { token, ready } = useRequireDriver();
  const [list, setList] = useState<MyRating[]>([]);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [cats, setCats] = useState({ driving: 0, behaviour: 0, punctuality: 0, vehicle: 0 });

  useEffect(() => {
    if (!token) return;
    fetch("/api/driver/ratings", { headers: { Authorization: "Bearer " + token } })
      .then((res) => res.json())
      .then((d) => {
        setList(d.ratings || []);
        setAvg(d.rating || 0);
        setCount(d.ratingsCount || 0);
        setCats(d.categories || { driving: 0, behaviour: 0, punctuality: 0, vehicle: 0 });
      })
      .catch(() => {});
  }, [token]);

  if (!ready || !token) return <p className="text-center text-[var(--mute)] py-10">…</p>;

  const cat = (k: "driving" | "behaviour" | "punctuality" | "vehicle") =>
    cats[k] ? cats[k].toFixed(1) : "—";

  return (
    <div className="pb-6">
      <h1 className="text-xl font-extrabold mb-3">{t("Ratings")}</h1>

      <Card className="text-center">
        <div className="text-4xl font-extrabold">{avg || "—"}</div>
        <div className="text-lg"><Stars n={Math.round(avg)} /></div>
        <div className="text-sm text-[var(--mute)] mt-1">{count} {t("ratings").toLowerCase()}</div>
        <div className="grid grid-cols-4 gap-2 mt-4 text-center">
          {([["driving", t("Driving")], ["behaviour", t("Behaviour")], ["punctuality", t("Punctuality")], ["vehicle", t("Vehicle")]] as const).map(([k, label]) => (
            <div key={k} className="bg-[var(--bg)] rounded-[14px] py-2">
              <div className="font-extrabold text-sm">{cat(k)}</div>
              <div className="text-[10px] text-[var(--mute)] font-semibold">{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {list.length ? (
        list.map((r) => (
          <Card key={r.id}>
            <div className="flex justify-between gap-2 items-start">
              <div className="font-bold text-sm">{r.route}</div>
              <Stars n={r.stars} />
            </div>
            <div className="text-xs text-[var(--mute)] mt-0.5">{r.date}</div>
            {r.reviewStatus === "pending" && (
              <span className="text-[10px] font-bold rounded-[10px] px-2 py-0.5 bg-[var(--tealbg)] text-[var(--brand,var(--primary-hover))] mt-1 inline-block">
                {te ? "సమీక్షలో ఉంది" : "Pending review"}
              </span>
            )}
            {r.comment && <div className="text-sm mt-1.5">“{r.comment}”</div>}
          </Card>
        ))
      ) : (
        <Empty>{te ? "ఇంకా రేటింగ్‌లు లేవు." : "No ratings yet."}</Empty>
      )}
      <p className="text-xs text-[var(--mute)] mt-3 text-center">{t("Ratings appear after a completed trip")}</p>
    </div>
  );
}
