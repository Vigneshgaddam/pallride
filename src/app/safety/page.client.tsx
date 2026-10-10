"use client";
import Link from "next/link";
import { ShieldCheck, Star, Flag, Ban, AlertTriangle, FileText, Check } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { EmergencyActions } from "@/components/safety/EmergencyActions";

// Static, fetch-free page: emergency info and safety controls must be
// reachable even with no network (PWA offline requirement).
export default function SafetyPage() {
  const t = useT();
  const { te } = useLang();

  const tips = te
    ? [
        "ప్రయాణానికి ముందు కుటుంబ సభ్యులతో మీ ట్రిప్ వివరాలు పంచుకోండి.",
        "ధృవీకరించిన డ్రైవర్ల నుండి మాత్రమే సీట్లు బుక్ చేయండి.",
        "డ్రైవర్ వాట్సాప్‌లో సీట్లు నిర్ధారించిన తర్వాతే చెల్లించండి.",
        "ఏదైనా అనుమానాస్పద ప్రవర్తన ఉంటే రిపోర్ట్ చేయండి.",
      ]
    : [
        "Share your trip details with family before you travel.",
        "Only book seats from verified drivers.",
        "Pay only after the driver confirms your seats on WhatsApp.",
        "Report any suspicious behaviour — we review every report.",
      ];

  return (
    <div className="pb-6 max-w-3xl mx-auto">
      <h1 className="text-xl md:text-2xl font-extrabold mb-3 flex items-center gap-2">
        <ShieldCheck size={20} className="text-[var(--primary)]" /> {t("Safety")}
      </h1>

      <EmergencyActions />

      <Card>
        <div className="font-extrabold text-sm flex items-center gap-1.5"><AlertTriangle size={15} className="text-[var(--amber)]" /> {te ? "భద్రతా చిట్కాలు" : "Safety tips"}</div>
        <ul className="grid gap-2 mt-2.5 text-sm sm:grid-cols-2">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <Check size={15} className="text-[var(--primary)] mt-0.5 shrink-0" /> {tip}
            </li>
          ))}
        </ul>
      </Card>

      <h2 className="text-sm font-bold text-[var(--mute)] uppercase tracking-wide mt-4 mb-2">{t("The PalleRide shield")}</h2>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Card className="!mb-0">
          <div className="flex items-start gap-3">
            <Star size={18} className="text-[var(--amber)] mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm">{t("Ratings & reviews")}</div>
              <p className="text-xs text-[var(--mute)] mt-0.5">
                {te ? "పూర్తయిన ప్రయాణాల తర్వాత మాత్రమే రేటింగ్; ప్రతి రివ్యూను సమీక్షించి ప్రచురిస్తాం." : t("Only after completed trips. Written reviews are moderated before going public.")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!mb-0">
          <div className="flex items-start gap-3">
            <Ban size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm">{te ? "నంబర్లను బ్లాక్ చేయండి" : "Block contacts"}</div>
              <p className="text-xs text-[var(--mute)] mt-0.5">
                {te ? "బ్లాక్ చేసిన నంబర్ మీ ట్రిప్పుల్లో బుక్ చేయలేదు." : t("Contacts you block can no longer book your trips.")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!mb-0">
          <div className="flex items-start gap-3">
            <Flag size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm">{t("Report")}</div>
              <p className="text-xs text-[var(--mute)] mt-0.5">
                {te ? "నివేదికలు పూర్తిగా గోప్యంగా ఉంచబడతాయి. అధికారి సమీక్షించి చర్య తీసుకుంటారు." : t("Reports stay confidential. An admin reviews and takes action.")}
              </p>
              <div className="mt-2">
                <Link href="/reports/new"><Button variant="alt" className="!py-2 !text-xs flex items-center justify-center gap-1"><FileText size={13} /> {t("Submit a report")}</Button></Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className="!mb-0">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm">{te ? "అత్యవసర విషయంలో" : "In an emergency"}</div>
              <p className="text-xs text-[var(--mute)] mt-0.5">
                {te ? "వెంటనే 112 కి కాల్ చేయండి. మీ ట్రిప్ వివరాలను నమ్మిన వ్యక్తితో పంచుకోండి." : t("Call 112 immediately and share your trip details with someone you trust.")}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
