"use client";
import { useState, useCallback } from "react";

// Small wrapper around admin mutation endpoints with per-action busy state
// (free-first: prevents double-taps, nothing cached).
export function useAdminAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = useCallback(async (method: string, url: string, body?: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Action failed");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, error, run };
}