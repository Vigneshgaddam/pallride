import { cn } from "@/lib/utils";

// Canonical route display: From → stop → stop → To
export function TripRoute({
  from, stops = [], to, className, muted = false,
}: {
  from: string;
  stops?: string[];
  to: string;
  className?: string;
  muted?: boolean;
}) {
  return (
    <span className={cn("font-bold leading-snug", muted && "font-semibold text-[13px]", className)}>
      {[from, ...stops, to].map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="text-[var(--primary)] font-extrabold"> → </span>}
          {p}
        </span>
      ))}
    </span>
  );
}
