import { Card } from "@/components/ui";

export function TripSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="!mb-2.5 animate-pulse">
          <div className="h-4 bg-[var(--line)] rounded w-3/4 mb-2.5" />
          <div className="h-3 bg-[var(--line)] rounded w-1/2 mb-3" />
          <div className="h-8 bg-[var(--line)] rounded w-full" />
        </Card>
      ))}
    </div>
  );
}
