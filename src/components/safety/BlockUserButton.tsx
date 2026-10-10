"use client";
import { useEffect, useState } from "react";
import { useT, useLang } from "@/lib/i18n";

// Block / unblock a contact (phone-scoped identity in the MVP).
// Blocked contacts can no longer book your trips.
export function BlockUserButton({
  myPhone, targetPhone, className = "",
}: {
  myPhone: string;
  targetPhone: string;
  className?: string;
}) {
  const t = useT();
  const { te } = useLang();
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!/^\d{10}$/.test(myPhone)) return;
    fetch("/api/block?phone=" + encodeURIComponent(myPhone))
      .then((res) => res.json())
      .then((d) => setBlocked((d.blocks || []).some((b: { targetPhone: string }) => b.targetPhone === targetPhone)))
      .catch(() => setBlocked(false));
  }, [myPhone, targetPhone]);

  if (blocked === null) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/block", {
        method: blocked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: myPhone, targetPhone }),
      });
      const d = await res.json();
      if (!res.ok) return;
      setBlocked(blocked ? !d.removed : true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        "text-xs font-bold underline cursor-pointer " +
        (blocked ? "text-[var(--primary)]" : "text-red-600") + " " + className
      }
    >
      {blocked ? (busy ? "…" : te ? "బ్లాక్ తీసివేయి" : "Unblock") : busy ? "…" : t("Block")}
    </button>
  );
}