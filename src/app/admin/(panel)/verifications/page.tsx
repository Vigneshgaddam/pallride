"use client";
import { useEffect, useState } from "react";
import { VerificationReview, type VerifDriver } from "@/components/admin/VerificationReview";

export default function AdminVerifications() {
  const [drivers, setDrivers] = useState<VerifDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function reload() {
    setError("");
    fetch("/api/admin/verifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject("Request failed")))
      .then((j) => setDrivers(j.verifications))
      .catch(() => setError("Cannot load the verification queue"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/verifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject("Request failed")))
      .then((j) => alive && setDrivers(j.verifications))
      .catch(() => alive && setError("Cannot load the verification queue"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Verifications</h2>
        <p className="text-[13px] text-[var(--muted)]">
          Each applicant carries an independent evidence ledger (phone, profile, vehicle, background).
          Approving implies all four checks.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error} <button onClick={reload} className="ml-2 font-bold underline cursor-pointer">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-[var(--tealbg)] animate-pulse" />)}
        </div>
      ) : drivers.length === 0 ? (
        <div className="rounded-xl border-dashed border-2 border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
          Queue is clear — every driver is verified.
        </div>
      ) : (
        <div className="space-y-3">
          {drivers.map((d) => (
            <VerificationReview key={d.id} driver={d} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}