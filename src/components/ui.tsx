import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  variant = "default", size = "md", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "alt" | "sun" | "danger" | "ghost";
  size?: "sm" | "md";
}) {
  return (
    <button
      className={cn(
        "w-full rounded-xl font-semibold cursor-pointer select-none transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
        "disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "px-3 py-2 text-[13px]" : "px-4 py-3 text-sm",
        variant === "default" && "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
        variant === "alt" && "bg-[var(--card)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--bg)] hover:border-[var(--primary)]",
        variant === "sun" && "bg-[var(--amber)] text-[var(--amber-ink)] hover:brightness-95",
        variant === "danger" && "bg-[var(--danger)] text-white hover:brightness-95",
        variant === "ghost" && "bg-transparent text-[var(--ink)] hover:bg-[var(--primary-soft)]",
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("border-0 bg-transparent outline-none flex-1 py-3 min-w-0 text-sm placeholder:text-[var(--mute)]", className)}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2.5 border border-[var(--line)] rounded-xl px-3 bg-[var(--card)] transition-colors focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-soft)]">
      <span className="text-xs text-[var(--mute)] w-16 shrink-0 font-semibold">{label}</span>
      {children}
    </label>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-[var(--card)] border border-[var(--line)] rounded-2xl p-4 mb-2.5 shadow-[var(--shadow-sm)]",
        className
      )}
      {...props}
    />
  );
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 bg-[var(--primary-soft)] text-[var(--primary-hover)] rounded-full px-2.5 py-0.5 text-xs font-bold",
        className
      )}
      {...props}
    />
  );
}

export function Alert({
  tone = "info", children, className,
}: { tone?: "info" | "success" | "warning" | "danger"; children: React.ReactNode; className?: string }) {
  const tones: Record<string, string> = {
    info: "bg-[var(--primary-soft)] text-[var(--primary-hover)] border-transparent",
    success: "bg-green-50 text-green-800 border-green-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div role="status" className={cn("rounded-xl border p-3 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-[var(--primary-soft)]", className)} aria-hidden />;
}

export function Sheet({
  open, onClose, labelledBy, children,
}: { open: boolean; onClose: () => void; labelledBy?: string; children: React.ReactNode }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="fixed inset-0 bg-black/45 flex items-end md:items-center justify-center z-50 md:p-6 animate-fade-in pr-no-print"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--card)] w-full max-w-[520px] rounded-t-2xl md:rounded-2xl p-5 pb-[calc(20px+env(safe-area-inset-bottom))] md:pb-5 max-h-[90%] overflow-auto animate-sheet-up shadow-[var(--shadow-lg)]">
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center text-[var(--mute)] py-8 px-3 border border-dashed border-[var(--line)] rounded-2xl">
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 my-4">
      <h2 className="text-lg font-bold">{children}</h2>
      {action}
    </div>
  );
}
