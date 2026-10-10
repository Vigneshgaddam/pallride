import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-4">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link href="/" className="text-[var(--primary)] underline">Go home</Link>
    </main>
  );
}