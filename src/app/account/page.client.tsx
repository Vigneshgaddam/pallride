"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Car, Shield, Star, User } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";

export default function AccountPage() {
  const t = useT();
  const { te, toggle } = useLang();
  const r = useRouter();
  const { token, name, phone, hydrate, logout } = useDriver();

  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <div className="pb-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-extrabold mb-4">{t("Account")}</h1>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div>
          {token ? (
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[var(--tealbg)] grid place-items-center text-[var(--primary)]"><User size={22} /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold flex items-center gap-1.5">
                    {name} <BadgeCheck size={15} className="text-[var(--primary)]" />
                  </div>
                  <div className="text-xs text-[var(--mute)]">+91 {phone}</div>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-sm text-[var(--mute)]">
                <span className="flex items-center gap-1"><Star size={14} className="text-[var(--amber)]" /> {t("ratings")}</span>
                <span className="flex items-center gap-1"><Car size={14} /> {t("My trips")}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                <Link href="/dashboard"><Button variant="alt" className="!py-2.5">{t("driverDashboard")}</Button></Link>
                <Button variant="alt" className="!py-2.5" onClick={() => { logout(); r.refresh(); }}>{t("Logout")}</Button>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-[var(--mute)] mb-3">
                {te ? "ట్రిప్పులు పోస్ట్ చేయడానికి, బుకింగ్‌లు నిర్వహించడానికి లాగిన్ చేయండి." : "Log in to post trips and manage bookings."}
              </p>
              <Link href="/auth/login">
                <Button>{t("Driver login")}</Button>
              </Link>
            </Card>
          )}
        </div>

        <div className="grid gap-2.5">
          <Button variant="alt" onClick={toggle}>{te ? "Switch to English" : "తెలుగులోకి మార్చండి"}</Button>
          <Link href="/safety">
            <Button variant="alt" className="flex items-center justify-center gap-2">
              <Shield size={16} /> {t("Safety")}
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-xs text-[var(--mute)] text-center mt-8">PalleRide · Phase 1 MVP</p>
    </div>
  );
}
