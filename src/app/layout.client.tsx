
import { Suspense } from "react";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { RootChrome } from "@/components/root-chrome";
import { PwaRegister } from "@/components/pwa-register";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)] pb-[90px]">
        <LangProvider>
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <RootChrome>{children}</RootChrome>
          </Suspense>
          <PwaRegister />
        </LangProvider>
      </body>
    </html>
  );
}


