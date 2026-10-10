"use client";

// Global error boundary
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-4">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white"
      >
        Try again
      </button>
    </main>
  );
}