import Link from "next/link";
import { ChatIcon } from "./icons";
import { site, waLink } from "@/lib/site";

const links = [
  { href: "/", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" aria-label="BelzGraphics home" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.png" alt="BelzGraphics — Design & Branding" className="h-7 w-auto" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 font-bold text-body md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="py-2 hover:text-brand">
              {l.label}
            </Link>
          ))}
        </nav>
        <a
          href={waLink(`Hi ${site.name}, I have a question`)}
          aria-label="Chat on WhatsApp"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
        >
          <ChatIcon />
        </a>
      </div>
    </header>
  );
}
