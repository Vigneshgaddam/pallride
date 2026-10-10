import Link from "next/link";
import { Camera, Tag, MessageCircle, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui";

// Phase 3: informational sell page (spec §9) — explains how selling works and
// funnels sellers to the dashboard.
const STEPS: [string, string, React.ReactNode][] = [
  [
    "Take car photos",
    "కారు ఫోటోలు తీయండి",
    <Camera key="i" size={20} className="text-[var(--primary)]" />,
  ],
  [
    "Add price, details & location",
    "ధర, వివరాలు మరియు స్థలం చేర్చండి",
    <Tag key="i" size={20} className="text-[var(--primary)]" />,
  ],
  [
    "Buyers enquire on WhatsApp",
    "కొనుగోలుదారులు వాట్సాప్‌లో అడుగుతారు",
    <MessageCircle key="i" size={20} className="text-[var(--primary)]" />,
  ],
  [
    "Inspect together, then close",
    "కలిసి కారు చూసి, ఒప్పందం ముగించండి",
    <BadgeCheck key="i" size={20} className="text-[var(--primary)]" />,
  ],
];

export default function SellPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--primary)] text-white rounded-[22px] p-5 mb-4">
        <h1 className="text-xl font-extrabold">Sell your car · మీ కారు అమ్మండి</h1>
        <p className="text-sm mt-1.5 opacity-90">
          List it free. Buyers in your area enquire on WhatsApp. No commissions.
          <span className="block opacity-80">
            ఉచితంగా లిస్ట్ చేయండి. సమీపంలోని కొనుగోలుదారులు వాట్సాప్‌లో అడుగుతారు. కమీషన్ లేదు.
          </span>
        </p>
      </div>

      <h2 className="text-sm font-bold mb-2">How it works · ఎలా పనిచేస్తుంది</h2>
      <div className="grid gap-2 mb-4 sm:grid-cols-2">
        {STEPS.map(([en, te, icon]) => (
          <Card key={en} className="flex items-center gap-3">
            <span className="bg-[var(--tealbg)] rounded-full p-2.5">{icon}</span>
            <div className="text-sm">
              <b className="block">{en}</b>
              <span className="text-[var(--mute)]">{te}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <b className="text-sm">Seller tips · విక్రేత చిట్కాలు</b>
        <ul className="mt-1.5 grid gap-1">
          {[
            ["Be honest about condition and repairs", "కండిషన్, మరమ్మతులు నిజాయితీగా చెప్పండి"],
            ["Good photos in daylight help sells", "పగటి వెలుతురులో మంచి ఫోటోలు అమ్మకానికి సాయం"],
            ["Meet buyers in a safe, public place", "కొనుగోలుదారులను సురక్షిత ప్రదేశంలో కలవండి"],
            ["PalleRide never guarantees the deal", "లావాదేవీకి PalleRide హామీ ఇవ్వదు"],
          ].map(([en, te]) => (
            <li key={en} className="text-[13px] text-[var(--mute)]">
              <span className="text-[var(--primary)] font-bold">•</span> {en} · {te}
            </li>
          ))}
        </ul>
      </Card>

      <Link href="/dashboard/sales/new" className="block mt-4">
        <div className="bg-[var(--primary)] text-white rounded-xl py-3.5 text-center font-extrabold">
          Sell your car · కారు అమ్మండి
        </div>
      </Link>
      <p className="text-xs text-[var(--mute)] text-center mt-2">
        No registration numbers or document photos, please — they are too personal.
        <span className="block">రిజిస్ట్రేషన్ నంబర్లు, పత్రాల ఫోటోలు జోడించవద్దు.</span>
      </p>
    </div>
  );
}