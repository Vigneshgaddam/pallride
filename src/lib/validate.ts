import type { CarListing, RentalListing, Trip } from "./types";

export function validateTrip(b: Partial<Trip>) {
  if (!b.from?.trim() || !b.to?.trim()) return "From and To are required";
  if (!b.date || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return "Valid date is required";
  if (!b.time || !/^\d{2}:\d{2}$/.test(b.time)) return "Valid time is required";
  if (!b.priceLo || Number(b.priceLo) < 1) return "Price must be at least ₹1";
  if (!b.seatsTotal || Number(b.seatsTotal) < 1 || Number(b.seatsTotal) > 12) return "Seats must be 1–12";
  return "";
}

// Phase 2 rentals: make/model (vehicle), location, seats+AC, price and window required.
export function validateRental(b: Partial<RentalListing>) {
  if (!`${b.make || ""} ${b.model || ""}`.trim()) return "Vehicle make and model are required";
  if (!b.location?.trim()) return "Location is required";
  if (!b.seats || Number(b.seats) < 1 || Number(b.seats) > 12) return "Seats must be 1–12";
  if (!b.ac) return "AC status is required";
  if (!b.pricePerDay || Number(b.pricePerDay) < 1) return "Rental price must be at least ₹1 per day";
  const from = b.availableFrom, to = b.availableTo;
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to))
    return "Valid availability dates are required";
  if (from > to) return "Available-to must be after available-from";
  // Availability may not be fully in the past (a listing can be ended via pause/remove).
  if (to < new Date().toISOString().slice(0, 10)) return "Availability window has ended";
  return "";
}

// Phase 3 cars: make+model, year, price, location, fuel+transmission, odometer required.
export function validateCar(b: Partial<CarListing>) {
  if (!`${b.make || ""} ${b.model || ""}`.trim()) return "Vehicle make and model are required";
  if (!b.year || !/^\d{4}$/.test(String(b.year)) || Number(b.year) < 1990 || Number(b.year) > new Date().getFullYear() + 1)
    return "A valid manufacturing year is required";
  if (!b.price || Number(b.price) < 1000) return "Asking price must be at least ₹1,000";
  if (!b.location?.trim()) return "Location is required";
  if (!["petrol", "diesel", "cng", "electric", "hybrid"].includes(b.fuel || "")) return "Fuel type is required";
  if (!["manual", "automatic"].includes(b.transmission || "")) return "Transmission is required";
  if (!b.odometer || Number(b.odometer) < 0 || Number(b.odometer) > 2000000) return "Odometer reading is required";
  return "";
}

export function validateVehicle(b: {
  type?: string; make?: string; model?: string; year?: string;
  regNumber?: string; seats?: number | string;
}) {
  if (!b.model?.trim()) return "Vehicle model is required";
  if (!b.regNumber?.trim()) return "Registration number is required";
  if (!b.seats || Number(b.seats) < 1 || Number(b.seats) > 12) return "Seats must be 1–12";
  return "";
}
