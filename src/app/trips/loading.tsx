import { TripSkeleton } from "@/components/trips/TripSkeleton";

export default function Loading() {
  return (
    <div>
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-[20px] p-3.5 mb-4 animate-pulse">
        <div className="h-12 bg-[var(--line)] rounded-[14px] mb-2.5" />
        <div className="h-12 bg-[var(--line)] rounded-[14px] mb-2.5" />
        <div className="h-10 bg-[var(--line)] rounded-[14px]" />
      </div>
      <h2 className="text-lg font-bold my-4 text-[var(--mute)]">…</h2>
      <TripSkeleton />
    </div>
  );
}
