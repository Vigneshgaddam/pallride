import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Server-side gate: every panel route first validates the pr_admin session
// cookie against the stored adminSessions (12h). No client fetches the guard —
// the DB is the source of truth.
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("pr_admin")?.value || "";
  const database = await db.load();
  const ok = Boolean(token) && database.adminSessions.some((s) => s.token === token);
  if (!ok) redirect("/admin/login");

  return (
    <div className="min-h-screen md:flex bg-[var(--bg)]">
      <aside className="md:w-56 md:border-r sticky top-0 md:h-screen md:overflow-y-auto bg-[var(--bg)]">
        <AdminSidebar />
      </aside>
      <div className="flex-1 min-w-0">
        <AdminHeader operator={database.settings.operator} />
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}