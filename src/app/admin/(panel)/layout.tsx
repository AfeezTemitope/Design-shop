import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { logout } from "../actions";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 px-5">
          <Link href="/admin" className="font-black">BelzGraphics admin</Link>
          <div className="flex items-center gap-1">
            <Link href="/" className="rounded-full px-3 py-2 text-sm font-bold text-brand-dark">View shop</Link>
            <form action={logout}>
              <button className="rounded-full px-3 py-2 text-sm font-bold text-muted">Log out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 pb-32 pt-4">{children}</main>
      <AdminNav />
    </>
  );
}
