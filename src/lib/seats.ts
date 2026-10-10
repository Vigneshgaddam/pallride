import type { Trip, BookingRequest, Availability, TripStatus } from "./types";

// Backend-authoritative seat logic. The browser never computes availability.

export function isPast(trip: Trip, now = new Date()) {
  const start = new Date(`${trip.date}T${trip.time || "00:00"}:00`);
  return start.getTime() < now.getTime();
}

export function effectiveStatus(trip: Trip, now = new Date()): TripStatus {
  if (trip.status === "published" && isPast(trip, now)) return "expired";
  return trip.status;
}

export function seatState(trip: Trip, requests: BookingRequest[]) {
  const held = new Set<number>();
  for (const r of requests) {
    if (r.tripId === trip.id && r.status === "pending") {
      for (const n of r.seats) if (n >= 1 && n <= trip.seatsTotal && !trip.seatsTaken.includes(n)) held.add(n);
    }
  }
  const heldSeats = [...held].sort((a, b) => a - b);
  const availableSeats = trip.seatsTotal - trip.seatsTaken.length - heldSeats.length;
  const availability: Availability = availableSeats <= 0 ? "full" : trip.seatsTaken.length || heldSeats.length ? "partial" : "open";
  return { heldSeats, availableSeats, availability };
}

export function publicTrip(trip: Trip, requests: BookingRequest[]) {
  const { availableSeats, availability } = seatState(trip, requests);
  return {
    id: trip.id,
    shareCode: trip.shareCode,
    from: trip.from,
    to: trip.to,
    stops: trip.stops,
    date: trip.date,
    time: trip.time,
    priceLo: trip.priceLo,
    priceHi: trip.priceHi,
    seatsTotal: trip.seatsTotal,
    availableSeats,
    availability,
    car: trip.car,
    ac: trip.ac,
    luggage: trip.luggage,
    notes: trip.notes,
    driverName: trip.driverName,
    driverId: trip.driverId,
    driverRating: trip.driverRating,
    driverVerified: trip.driverVerified,
    status: effectiveStatus(trip),
  };
}

export type PublicTrip = ReturnType<typeof publicTrip>;

export function routeLine(t: { from: string; stops?: string[]; to: string }) {
  return [t.from, ...(t.stops || []), t.to].join(" → ");
}
