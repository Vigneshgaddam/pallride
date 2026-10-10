"use client";
import { Car } from "lucide-react";

// Full-resolution images load only on the details page — search never renders these.
export function VehicleGallery({ photos, title }: { photos: string[]; title: string }) {
  if (!photos.length)
    return (
      <div className="bg-[var(--tealbg)] rounded-[20px] overflow-hidden border border-[var(--line)] h-52 flex items-center justify-center">
        <Car size={56} className="text-[var(--primary)]" />
      </div>
    );
  return (
    <div className="bg-[var(--tealbg)] rounded-[20px] overflow-hidden border border-[var(--line)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photos[0]} alt={title} className="w-full h-52 object-cover" />
      {photos.length > 1 && (
        <div className="flex gap-2 p-2 overflow-x-auto [scrollbar-width:none]">
          {photos.slice(1, 6).map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt="" className="h-16 w-24 object-cover rounded-[12px] border border-[var(--line)]" />
          ))}
        </div>
      )}
    </div>
  );
}