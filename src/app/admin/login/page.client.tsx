"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Login failed");
        return;
      }
      router.replace("/admin");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="w-full max-w-xs rounded-3xl border bg-[var(--card)] p-6 shadow-sm">
        <h1 className="text-xl font-black mb-1">PalleRide</h1>
        <p className="text-[13px] text-[var(--muted)] mb-5">Admin access key required.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
            autoFocus
            className="w-full rounded-xl border px-3 py-2.5 text-[15px] outline-none focus:border-[var(--primary)]"
          />
          {error && <p className="text-[13px] font-semibold text-red-600">{error}</p>}
          <button
            disabled={busy || !key}
            className="w-full rounded-xl bg-[var(--primary)] text-white font-bold py-2.5 disabled:opacity-40"
          >
            {busy ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}