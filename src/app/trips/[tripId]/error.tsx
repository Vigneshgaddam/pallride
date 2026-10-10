"use client";
import Link from "next/link";
import { Button, Empty } from "@/components/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-8">
      <Empty>
        <p className="mb-3">Could not load this trip. Check connection and retry.</p>
        <div className="grid gap-2 max-w-[240px] mx-auto">
          <Button variant="alt" onClick={reset}>Retry</Button>
          <Link href="/trips"><Button variant="alt">Back to trips</Button></Link>
        </div>
      </Empty>
    </div>
  );
}
