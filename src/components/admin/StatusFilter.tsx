"use client";

export function StatusFilter({
  value, onChange, options, allLabel = "All",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] pb-1">
      <button
        onClick={() => onChange("")}
        className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold cursor-pointer ${
          value === "" ? "bg-[var(--primary)] text-white" : "bg-[var(--tealbg)] text-[var(--ink)]"
        }`}
      >
        {allLabel}
      </button>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold cursor-pointer ${
            value === o.value ? "bg-[var(--primary)] text-white" : "bg-[var(--tealbg)] text-[var(--ink)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}