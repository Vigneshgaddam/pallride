"use client";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import type { PublicTrip } from "@/lib/seats";
import { Button, Card } from "@/components/ui";
import { SeatMap } from "./SeatMap";
import { SeatCounter } from "./SeatCounter";
import { DriverSummary } from "./DriverSummary";
import { TripStops } from "./TripStops";
import { TripRoute } from "./TripRoute";
import { TripStatus } from "./TripStatus";
import { ShareTrip } from "./ShareTrip";
import { WhatsAppBooking, type BookingTrip } from "./WhatsAppBooking";
import { RateTrip } from "./RateTrip";
import { EmergencyActions } from "@/components/safety/EmergencyActions";
import { ShareTripSafety } from "@/components/safety/ShareTripSafety";
import { ReportDialog } from "@/components/safety/ReportDialog";
import { useT } from "@/lib/i18n";
import { fmtTime, priceLabel, whenLabel } from "@/lib/utils";

export type TripDetail = PublicTrip & {
  seatsTaken: number[];
  seatsHeld: number[];
  driverPhone?: string;
  driverTrips?: number;
};

export function TripDetails({ initial }: { initial: TripDetail }) {
  const t = useT();
  const [trip, setTrip] = useState<TripDetail>(initial);
  const [prevId, setPrevId] = useState(initial.id);
  const [sel, setSel] = useState<number[]>([]);
  const [booking, setBooking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState(false);

  // Reset state when navigating to a different trip (render-phase adjust)
  if (initial.id !== prevId) {
    setPrevId(initial.id);
    setTrip(initial);
    setSel([]);
    setBooking(false);
    setReporting(false);
    setError(false);
  }

  const load = () =>
    fetch("/api/trips/" + trip.id)
      .then((res) => res.json())
      .then((d) => {
        if (d.trip) { setError(false); setTrip(d.trip); }
        else setError(true);
      })
      .catch(() => setError(true));

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  if (error)
    return (
      <div className="py-10 text-center">
        <p className="text-[var(--mute)] mb-3">{t("Could not load. Check connection and retry.")}</p>
        <Button variant="alt" onClick={load}>{t("Retry")}</Button>
      </div>
    );

  const bookable = trip.status === "published" && trip.availableSeats > 0;

  const bookingTrip: BookingTrip = {
    id: trip.id, shareCode: trip.shareCode, from: trip.from, to: trip.to, stops: trip.stops,
    date: trip.date, time: trip.time, priceLo: trip.priceLo, priceHi: trip.priceHi,
    seats: sel, name: "", phone: "",
  };

  return (
    <div className="pb-6">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-extrabold leading-snug">
            <TripRoute from={trip.from} stops={trip.stops} to={trip.to} />
          </h1>
          <p className="text-sm text-[var(--mute)] mt-1">
            {whenLabel(trip.date)} · {fmtTime(trip.time)} · {priceLabel(trip.priceLo, trip.priceHi)} / {t("Seat").toLowerCase()}
          </p>
          <p className="mt-1.5">
            <TripStatus status={trip.status} availableSeats={trip.availableSeats} />
          </p>
        </div>
        <ShareTrip trip={trip} variant="icon" className="shrink-0 mt-1" />
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-6 lg:items-start">
        <div className="min-w-0">
          {trip.stops.length > 0 && (
            <Card>
              <TripStops stops={trip.stops} />
            </Card>
          )}

          <DriverSummary
            name={trip.driverName}
            driverId={trip.driverId}
            verified={trip.driverVerified}
            rating={trip.driverRating}
            completedTrips={trip.driverTrips}
            phone={trip.driverPhone}
          />

          {trip.status === "completed" && <RateTrip tripId={trip.shareCode || trip.id} />}

          <SeatMap
            total={trip.seatsTotal}
            taken={trip.seatsTaken}
            held={trip.seatsHeld}
            selected={sel}
            onToggle={(n) => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n].sort((a, b) => a - b)))}
          />

          <SeatCounter selected={sel} priceLo={trip.priceLo} priceHi={trip.priceHi} onClear={() => setSel([])} />

          <Button
            onClick={() => {
              if (!sel.length) return flash(t("Select at least one seat"));
              setBooking(true);
            }}
            disabled={!bookable}
          >
            {trip.status !== "published" ? <TripStatus status={trip.status} />
              : trip.availableSeats <= 0 ? t("FULL")
              : t("Reserve seats & WhatsApp")}
          </Button>

          <div className="flex gap-2.5 mt-2.5">
            <ShareTrip trip={trip} />
            <button
              onClick={() => setReporting(true)}
              className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-sm font-bold cursor-pointer"
            >
              <ShieldAlert size={16} /> {t("Report")}
            </button>
          </div>
        </div>

        <div className="min-w-0 mt-4 lg:mt-0">
          <EmergencyActions />
          <div className="mt-2.5">
            <Card>
              <div className="font-extrabold text-sm">{t("Share trip with family")}</div>
              <ShareTripSafety trip={trip} />
            </Card>
          </div>
        </div>
      </div>

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="trip"
        targetId={trip.shareCode || trip.id}
        targetPhone={trip.driverPhone}
      />

      <WhatsAppBooking
        trip={bookingTrip}
        selected={sel}
        open={booking}
        onClose={() => setBooking(false)}
        onBooked={() => {
          setSel([]);
          flash(t("Booking request sent"));
          load();
        }}
        onRefresh={load}
      />

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 top-4 bg-[var(--ink)] text-[var(--bg)] px-4 py-2.5 rounded-[14px] text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
