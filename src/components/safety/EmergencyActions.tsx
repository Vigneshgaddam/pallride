"use client";
import { PhoneCall, Siren } from "lucide-react";
import { useT, useLang } from "@/lib/i18n";

// Fully static — works without any API call, so 112 is always reachable
// even on a slow or failed connection.
export function EmergencyActions() {
  const t = useT();
  const { te } = useLang();
  return (
    <div className="rounded-[18px] border border-red-200 bg-red-50 p-4 mb-2.5">
      <div className="flex items-center gap-2 font-extrabold text-red-700">
        <Siren size={16} /> {te ? "అత్యవసర సహాయం" : "Emergency assistance"}
      </div>
      <a
        href="tel:112"
        className="mt-3 flex items-center justify-center gap-2 rounded-[14px] bg-red-600 text-white py-3.5 font-extrabold"
      >
        <PhoneCall size={18} /> {te ? "112 కి కాల్ చేయండి" : "Call 112"}
      </a>
      <p className="text-xs text-red-700/90 mt-2.5 text-center font-semibold">
        {te ? "భారతదేశ అత్యవసర నంబర్ — పోలీస్, ఫైర్, యాంబులెన్స్. 24×7 ఉచితం." : t("India's 24×7 emergency number — police, fire, ambulance. Free.")}
      </p>
    </div>
  );
}