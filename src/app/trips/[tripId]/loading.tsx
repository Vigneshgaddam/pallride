export default function Loading() {
  return (
    <div className="pb-6 animate-pulse" aria-hidden>
      <div className="h-6 bg-[var(--line)] rounded w-3/4 mb-2" />
      <div className="h-4 bg-[var(--line)] rounded w-1/2 mb-4" />
      <div className="h-28 bg-[var(--line)] rounded-[18px] mb-3" />
      <div className="h-24 bg-[var(--line)] rounded-[18px] mb-3" />
      <div className="h-56 bg-[var(--line)] rounded-[18px] mb-3" />
      <div className="h-12 bg-[var(--line)] rounded-xl" />
    </div>
  );
}
