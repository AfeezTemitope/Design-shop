"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Designs" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin/designs/")) return null;
  return (
    <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5">
      <div className="mx-auto grid max-w-2xl grid-cols-3">
        {tabs.map((t) => {
          const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1.5 text-[13px] font-extrabold ${active ? "text-brand" : "text-muted"}`}
            >
              <span className={`h-1 w-10 rounded ${active ? "bg-brand" : "bg-transparent"}`} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
