"use client";
import { useState } from "react";
import { useAdminAction } from "@/components/admin/useAdminAction";

export type VerifDriver = {
  id: string; name: string; phone: string; email: string;
  status: string; verification: string; reviewNote: string;
  checks: Record<string, boolean>;
  vehicles: { id: string; type: string; make: string; model: string; year: number; seats: number; ac: boolean; fuel: string; regNumber: string; photos: string[] }[];
  createdAt: string;
};

const CHECK_LABEL: Record<string, string> = {
  phone: "Phone ownership", profile: "Profile & bio", vehicle: "Vehicle documents", background: "Background check",
};

export function VerificationReview({ driver, onChanged }: { driver: VerifDriver; onChanged: () => void }) {
  const { busy, error, run } = useAdminAction();
  const [note, setNote] = useState(driver.reviewNote);

  async function act(payload: Record<string, unknown>) {
    if (!(await run("PATCH", `/api/admin/verifications/${driver.id}`, payload))) return;
    onChanged();
  }

  return (
    <div className="rounded-2xl border bg-[var(--card)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-black">{driver.name}</p>
          <p className="text-[12px] text-[var(--muted)]">+91 {driver.phone} {driver.email ? `· ${driver.email}` : ""}</p>
        </div>
        <span className="rounded-full bg-[var(--tealbg)] px-2.5 py-1 text-[11px] font-bold">{driver.verification}</span>
      </div>

      {driver.vehicles.map((v) => (
        <div key={v.id} className="mt-3 rounded-xl bg-[var(--tealbg)] px-3 py-2 text-[12px]">
          <p className="font-bold">{v.make} {v.model} · {v.type}</p>
          <p className="text-[var(--muted)]">
            {v.year} · {v.seats} seats{", "}{v.ac ? "AC" : "non-AC"} · {v.fuel} · <span className="font-mono text-[11px]">{v.regNumber}</span>
          </p>
        </div>
      ))}

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.entries(driver.checks).map(([c, ok]) => (
          <button
            key={c}
            onClick={() => act({ action: "check", check: c, ok: !ok, note })}
            className={`rounded-lg border px-2 py-1.5 text-[12px] font-bold cursor-pointer disabled:opacity-50 text-left ${
              ok ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--card)]"
            }`}
          >
            <span className="block font-black text-[13px]">{CHECK_LABEL[c]}</span>
            <span className="opacity-70">{ok ? "Verified" : "Not verified"}</span>
          </button>
        ))}
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Reviewer note (recorded in audit log)"
        className="mt-3 w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)]"
      />

      {error && <p className="mt-2 text-[12px] font-semibold text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => act({ action: "approve", note })} disabled={busy} className="rounded-xl bg-[var(--primary)] text-white font-bold px-3 py-1.5 text-[13px] cursor-pointer disabled:opacity-40">
          Approve all
        </button>
        <button onClick={() => act({ action: "changes", note })} disabled={busy} className="rounded-xl border border-amber-400 text-amber-600 font-bold px-3 py-1.5 text-[13px] cursor-pointer disabled:opacity-40">
          Request changes
        </button>
        <button onClick={() => act({ action: "reject", note })} disabled={busy} className="rounded-xl border border-red-300 text-red-600 font-bold px-3 py-1.5 text-[13px] cursor-pointer disabled:opacity-40">
          Reject
        </button>
      </div>
    </div>
  );
}