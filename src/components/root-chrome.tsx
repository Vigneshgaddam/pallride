"use client";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { Footer } from "@/components/footer";
import { DriverBookingAlert } from "@/components/driver-booking-alert";

// The public app renders inside a responsive column: a comfortable
// single column on phones, and a wide shell on desktop where the header
// swaps the bottom nav for an inline navigation bar.
// The admin panel is a separate full-width workspace — it still lives in
// the same root layout so it reuses the same host/auth/db and only its routes
// are guarded server-side by app/admin/(panel)/layout.tsx.
export function RootChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const admin = path.startsWith("/admin");
  if (admin) return <main className="min-h-screen">{children}</main>;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[520px] flex-1 px-[18px] py-1 md:max-w-6xl md:px-8 md:py-4">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <DriverBookingAlert />
    </>
  );
}
