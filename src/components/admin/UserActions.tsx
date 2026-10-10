"use client";
import { useAdminAction } from "@/components/admin/useAdminAction";

const promptReason = (msg: string) => {
  const v = window.prompt(msg, "");
  return v === null ? null : v.trim();
};

export function UserActions({
  userId, status, onChanged,
}: {
  userId: string;
  status: string;
  onChanged: () => void;
}) {
  const { busy, error, run } = useAdminAction();
  const suspended = status === "suspended";

  async function act(action: "suspend" | "activate") {
    const note = action === "suspend" ? promptReason("Reason for suspending this account (required):") : "";
    if (action === "suspend" && note === null) return;
    if (note !== null && !(await run("PATCH", `/api/admin/users/${userId}`, { action, note }))) return;
    onChanged();
  }

  return (
    <div className="flex flex-col gap-1 items-start">
      {error && <span className="text-[11px] text-red-600 font-semibold">{error}</span>}
      {suspended ? (
        <button onClick={() => act("activate")} disabled={busy} className="text-[12px] font-bold text-[var(--primary)] cursor-pointer disabled:opacity-40">
          Reactivate
        </button>
      ) : (
        <button onClick={() => act("suspend")} disabled={busy} className="text-[12px] font-bold text-red-600 cursor-pointer disabled:opacity-40">
          Suspend
        </button>
      )}
    </div>
  );
}