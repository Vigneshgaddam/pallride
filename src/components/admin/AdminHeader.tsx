"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminHeader({ operator }: { operator: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
    }
  }
  return (
    <header className="flex items-center justify-between gap-3 border-b px-4 md:px-8 py-3">
      <div className="min-w-0">
        <h1 className="text-lg font-black leading-tight">PalleRide Control Center</h1>
        <p className="text-[12px] text-[var(--muted)] truncate">{operator}</p>
      </div>
      <button
        onClick={logout}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50"
      >
        <LogOut size={16} /> Sign out
      </button>
    </header>
  );
}