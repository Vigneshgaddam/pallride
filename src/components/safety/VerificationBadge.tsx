import { BadgeCheck } from "lucide-react";

// Never renders a badge until the driver's checks are actually approved.
export function VerificationBadge({
  verified, className = "",
}: {
  verified: boolean;
  className?: string;
}) {
  if (!verified) return null;
  return (
    <span
      className={"inline-flex items-center gap-1 bg-[var(--primary)]/15 text-[#0A7A60] text-[11px] font-bold rounded-[10px] px-2 py-0.5 " + className}
    >
      <BadgeCheck size={13} /> Verified Driver
    </span>
  );
}