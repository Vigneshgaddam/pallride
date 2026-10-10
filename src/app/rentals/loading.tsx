import { RentalSkeleton } from "@/components/rentals/RentalSkeleton";

export default function Loading() {
  return (
    <div>
      <div className="h-9 w-36 bg-[var(--line)] rounded-lg animate-pulse mb-4" />
      <RentalSkeleton />
    </div>
  );
}