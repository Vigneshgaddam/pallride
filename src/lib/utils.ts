import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function priceLabel(lo: number, hi: number, seats = 1) {
  const f = (n: number) => inr(n * seats);
  return lo === hi ? f(lo) : `${f(lo)}–${f(hi)}`;
}

export const WA_NUMBER = "919000000000";
export function waLink(msg: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// Short public share codes (no confusing 0/O/1/I) → /trips/AB82KD
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newShareCode(taken: Set<string> = new Set()) {
  for (let i = 0; i < 50; i++) {
    let code = "";
    for (let j = 0; j < 6; j++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    if (!taken.has(code)) return code;
  }
  return "X" + Date.now().toString(36).toUpperCase().slice(-6);
}

export function tripShareText(trip: {
  shareCode?: string; id: string; from: string; to: string; stops?: string[];
  date: string; time: string; priceLo?: number; availableSeats?: number;
  driverRating?: number; driverVerified?: boolean;
}) {
  const head = [
    "🚗 PalleRide Trip",
    [trip.from, ...(trip.stops || []), trip.to].join(" → "),
    `${whenLabel(trip.date)} · ${fmtTime(trip.time)}`,
    trip.priceLo != null ? `${priceLabel(trip.priceLo, trip.priceLo)}/seat` : "",
    trip.availableSeats != null
      ? trip.availableSeats > 0 ? `🟢 ${trip.availableSeats} seats available` : "🔴 FULL"
      : "",
    trip.driverRating != null && trip.driverRating > 0
      ? `⭐ ${trip.driverRating.toFixed(1)}${trip.driverVerified ? " Verified Driver" : " Driver"}`
      : "",
  ].filter(Boolean);
  const url = `${typeof location !== "undefined" ? location.origin : ""}/trips/${trip.shareCode || trip.id}`;
  return [...head, "", "Book your seat on PalleRide", url].join("\n");
}

export function whenLabel(date: string) {
  const d = new Date(date + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return fmtDate(date);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* secure-context clipboard unavailable — try legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.setAttribute("readonly", "");
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export async function shareTrip(trip: {
  id: string; shareCode?: string; from: string; to: string; stops?: string[];
  date: string; time: string; priceLo?: number; availableSeats?: number;
  driverRating?: number; driverVerified?: boolean;
}) {
  const url = location.origin + "/trips/" + (trip.shareCode || trip.id);
  const text = tripShareText(trip);
  try {
    if (navigator.share) {
      await navigator.share({ title: "PalleRide", text, url });
      return "shared";
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "";
  }
  const ok = await copyText(text);
  return ok ? "copied" : "";
}
