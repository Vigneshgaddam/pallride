import { Card } from "@/components/ui";

// Loading placeholder for /cars (also used as route loading.tsx).
export function ListingSkeleton() {
  return (
    <div aria-busy="true">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="!p-0 overflow-hidden">
          <div className="h-36 bg-[var(--tealbg)] animate-pulse" />
          <div className="p-3.5 space-y-2">
            <div className="h-4 w-2/3 bg-[var(--line)] rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-[var(--line)] rounded animate-pulse" />
            <div className="h-5 w-1/3 bg-[var(--line)] rounded animate-pulse" />
          </div>
        </Card>
      ))}
    </div>
  );
}