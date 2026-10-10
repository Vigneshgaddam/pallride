"use client";
import { useAdminAction } from "@/components/admin/useAdminAction";

export function ListingModeration({
  kind, itemId, status, onChanged,
}: {
  kind: "rental" | "car";
  itemId: string;
  status: string;
  onChanged: () => void;
}) {
  const { busy, error, run } = useAdminAction();
  const removed = status === "removed";
  const url = `/api/admin/${kind === "rental" ? "rentals" : "listings"}/${itemId}`;

  async function act(action: "remove" | "restore") {
    const note = action === "remove" ? prompt("Reason for removing this listing (required):") ?? "" : "";
    if (action === "remove" && note.trim() === "") return;
    if (!(await run("PATCH", url, { action, note }))) return;
    onChanged();
  }

  return (
    <div className="flex flex-col gap-1 items-start">
      {error && <span className="text-[11px] text-red-600 font-semibold">{error}</span>}
      {removed ? (
        <button onClick={() => act("restore")} disabled={busy} className="text-[12px] font-bold text-[var(--primary)] cursor-pointer disabled:opacity-40">
          Restore
        </button>
      ) : (
        <button onClick={() => act("remove")} disabled={busy} className="text-[12px] font-bold text-red-600 cursor-pointer disabled:opacity-40">
          Remove
        </button>
      )}
    </div>
  );
}