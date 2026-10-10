"use client";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { Card } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";

export function SellerProfile({
  seller,
}: {
  seller: { id: string; name: string; photo: string; rating: number; verified: boolean; joined: string; phone: string };
}) {
  const t = useT();
  const { te } = useLang();
  return (
    <Card>
      <b className="text-sm">{t("Seller")}</b>
      <Link href={seller.id ? "/drivers/" + seller.id : "#"} className="flex items-center gap-3 mt-2.5">
        {seller.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={seller.photo} alt={seller.name} className="h-12 w-12 rounded-full object-cover border border-[var(--line)]" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-[var(--primary)] text-white font-extrabold flex items-center justify-center">
            {seller.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            {seller.name}
            {seller.verified && <BadgeCheck size={15} className="text-[var(--primary)]" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--mute)] mt-0.5">
            {seller.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star size={12} className="text-[var(--amber)]" fill="var(--amber)" /> {seller.rating.toFixed(1)}
              </span>
            )}
            {seller.joined && <span>{te ? "నుండి" : "On PalleRide since"} {new Date(seller.joined).getFullYear()}</span>}
          </div>
        </div>
        <span className="text-xs font-bold text-[var(--primary)]">{t("View profile")} →</span>
      </Link>
      <p className="text-xs text-[var(--mute)] mt-2 bg-[var(--tealbg)] rounded-[12px] px-3 py-2">
        {te
          ? "విక్రేతను ఎంక్వైరీ ద్వారా మాత్రమే సంప్రదించండి. పేమెంట్‌కు ముందు కారు, పత్రాలను తప్పక చూసుకోండి."
          : "Contact the seller through the enquiry below. Always inspect the car and its papers before any payment."}
      </p>
    </Card>
  );
}