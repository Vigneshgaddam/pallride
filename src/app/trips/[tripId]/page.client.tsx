import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { publicTrip, seatState } from "@/lib/seats";
import { TripDetails } from "@/components/trips/TripDetails";

// Trip page resolved by id OR shareCode (/trips/AB82KD) — server-rendered for SEO.
export async function generateMetadata({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const database = await db.load();
  const trip = database.trips.find((t) => t.id === tripId || t.shareCode === tripId);
  if (!trip) return { title: "Trip not found · PalleRide" };
  const route = [trip.from, ...trip.stops, trip.to].join(" → ");
  return {
    title: `${route} · PalleRide`,
    description: `${trip.date} ${trip.time} · ₹${trip.priceLo}/seat · Book your seat on WhatsApp.`,
  };
}

export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const database = await db.load();
  const trip = database.trips.find((t) => t.id === tripId || t.shareCode === tripId);
  if (!trip) notFound();
  const { heldSeats } = seatState(trip, database.requests);
  const driver = database.drivers.find((d) => d.id === trip.driverId);

  return (
    <TripDetails
      initial={{
        ...publicTrip(trip, database.requests),
        seatsTaken: trip.seatsTaken,
        seatsHeld: heldSeats,
        driverPhone: trip.driverPhone,
        driverTrips: driver?.tripsCount ?? 0,
      }}
    />
  );
}
