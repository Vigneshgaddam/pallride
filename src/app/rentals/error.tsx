"use client";
import { useEffect } from "react";
import { Empty, Button } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const t = useT();
  const { te } = useLang();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Empty>
      {te ? "ఏదో తప్పు జరిగింది. మళ్లీ ప్రయత్నించండి." : "Something went wrong. Please try again."}
      <div className="h-2" />
      <Button variant="alt" onClick={reset}>{t("Try again")}</Button>
    </Empty>
  );
}