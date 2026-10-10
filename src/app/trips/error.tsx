"use client";
import { Button, Empty } from "@/components/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-8">
      <Empty>
        <p className="mb-3">Could not load trips. Check connection and retry.</p>
        <Button variant="alt" onClick={reset}>Retry</Button>
      </Empty>
    </div>
  );
}
