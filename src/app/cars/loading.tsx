import { ListingSkeleton } from "@/components/marketplace/ListingSkeleton";

export default function Loading() {
  return (
    <div>
      <div className="h-9 w-36 bg-[var(--line)] rounded-lg animate-pulse mb-4" />
      <ListingSkeleton />
    </div>
  );
}