"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MailIcon, ShopIcon, UserIcon } from "./icons";

const tabs = [
  { href: "/", label: "Shop", Icon: ShopIcon },
  { href: "/about", label: "About", Icon: UserIcon },
  { href: "/contact", label: "Contact", Icon: MailIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  // Design pages show their own order bar instead of the tabs
  if (pathname.startsWith("/d/") || pathname.startsWith("/order/")) return null;

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-white pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 md:hidden"
    >
      {tabs.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 text-xs font-extrabold ${
              active ? "text-brand" : "text-muted"
            }`}
          >
            <Icon className="size-6" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
