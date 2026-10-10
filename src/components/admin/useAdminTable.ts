"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Generic paginated admin-table controller — free-first friendly: small pages,
// explicit Retry, and no off-screen fetches. `status` null = all rows.
export function useAdminTable<T>({ url }: { url: string }) {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const seq = useRef(0);

  const load = useCallback(
    async (p: number, s: string) => {
      const id = ++seq.current;
      setLoading(true);
      setError("");
      try {
        const q = new URLSearchParams({ page: String(p) });
        if (s) q.set("status", s);
        const res = await fetch(`${url}?${q.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Request failed");
        const j = await res.json();
        if (id !== seq.current) return;
        setRows((j.rows || j.users || j.trips || j.bookings || j.rentals || j.listings || j.reviews || j.reports || j.incidents || j.logs || j.verifications || []) as T[]);
        setTotal(j.total ?? j.rows?.length ?? 0);
        setPageCount(j.pageCount ?? 1);
        setPage(p);
      } catch (e) {
        if (id !== seq.current) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (id === seq.current) setLoading(false);
      }
    },
    [url]
  );

  useEffect(() => {
    let alive = true;
    const id = ++seq.current;
    fetch(`${url}?page=1`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject("Request failed")))
      .then((j) => {
        if (!alive || id !== seq.current) return;
        setRows((j.rows || j.users || j.trips || j.bookings || j.rentals || j.listings || j.reviews || j.reports || j.incidents || j.logs || j.verifications || []) as T[]);
        setTotal(j.total ?? j.rows?.length ?? 0);
        setPageCount(j.pageCount ?? 1);
        setPage(1);
      })
      .catch(() => {
        if (alive && id === seq.current) setError("Failed to load");
      })
      .finally(() => {
        if (alive && id === seq.current) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [url]);

  function changeStatus(s: string) {
    setStatus(s);
    load(1, s);
  }
  function reload() {
    load(page, status);
  }
  function setPageGo(p: number) {
    load(p, status);
  }

  return { rows, total, page, pageCount, status, loading, error, setPage: setPageGo, changeStatus, reload };
}