import type { Metadata } from "next";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const row = "flex min-h-14 items-center justify-between rounded-2xl px-5 font-bold";
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-3 px-5 pt-5 md:pt-12">
      <h1 className="text-[26px] font-black">Let&rsquo;s talk</h1>
      <p className="mb-2 leading-relaxed text-body">
        Branding, custom work, or something not in the shop? Send me the details and I&rsquo;ll quote you.
      </p>
      <a href={waLink(`Hi ${site.name}, I have a custom design request`)} className={`${row} bg-brand font-extrabold text-white`}>
        WhatsApp · {site.whatsappDisplay} <span aria-hidden>→</span>
      </a>
      <a href={`https://ig.me/m/${site.instagram}`} className={`${row} border border-line bg-white`}>
        Instagram · @{site.instagram} <span aria-hidden>→</span>
      </a>
      <a href={`https://www.tiktok.com/@${site.tiktok}`} className={`${row} border border-line bg-white`}>
        TikTok · @{site.tiktok} <span aria-hidden>→</span>
      </a>
      <a href={`mailto:${site.email}`} className={`${row} border border-line bg-white`}>
        {site.email} <span aria-hidden>→</span>
      </a>
    </div>
  );
}
