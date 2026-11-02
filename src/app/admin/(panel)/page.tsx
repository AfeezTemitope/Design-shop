import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleLive } from "../actions";
import { cld, videoPoster } from "@/lib/cloudinary";
import { naira } from "@/lib/format";
import { PlusIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminDesigns() {
  const designs = await prisma.design.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { category: true, media: { orderBy: { sortOrder: "asc" } }, packages: { select: { price: true } } },
  });
  const live = designs.filter((d) => d.isLive).length;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-black">My designs</h1>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-line bg-white p-3.5"><span className="block text-xs font-bold text-muted">Live on shop</span><span className="text-2xl font-black">{live}</span></div>
        <div className="rounded-2xl border border-line bg-white p-3.5"><span className="block text-xs font-bold text-muted">Hidden</span><span className="text-2xl font-black">{designs.length - live}</span></div>
      </div>

      {designs.length === 0 && (
        <p className="rounded-2xl border border-line bg-white p-6 text-center text-muted">No designs yet. Tap “Add design” to upload your first one.</p>
      )}

      {designs.map((d) => {
        const cover = d.media[0];
        const thumb = cover ? (cover.type === "VIDEO" ? videoPoster(cover.url, 120) : cld(cover.url, "f_auto,q_auto,w_120,h_120,c_fill")) : undefined;
        const from = d.packages.length ? Math.min(...d.packages.map((p) => p.price)) : null;
        return (
          <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
            <Link href={`/admin/designs/${d.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <span className="relative size-15 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {thumb && <img src={thumb} alt="" className="size-full object-cover" />}
                <span className="absolute bottom-1 right-1 rounded bg-ink/75 px-1 text-[10px] font-bold text-white">{d.media.length}</span>
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-extrabold">{d.title}</span>
                <span className="text-[13px] text-muted">
                  {d.category.name} · {d.pricingType === "QUOTE" ? "price on request" : from != null ? `from ${naira(from)}` : "no price"}
                </span>
                <span className={`self-start rounded-full px-2 py-0.5 text-[11px] font-extrabold ${d.pricingType === "QUOTE" ? "bg-[#f2eff7] text-ink" : "bg-brand-soft text-brand-dark"}`}>
                  {d.pricingType === "QUOTE" ? "Quote" : "Fixed price"}
                </span>
              </span>
            </Link>
            <form action={toggleLive.bind(null, d.id)}>
              <button
                aria-label={d.isLive ? `Hide ${d.title} from shop` : `Show ${d.title} on shop`}
                aria-pressed={d.isLive}
                className={`flex h-7.5 w-12.5 items-center rounded-full p-0.75 ${d.isLive ? "justify-end bg-brand" : "justify-start bg-[#d4cfdd]"}`}
              >
                <span className="size-6 rounded-full bg-white" />
              </button>
            </form>
          </div>
        );
      })}

      <Link
        href="/admin/designs/new"
        className="fixed bottom-24 right-5 z-30 flex min-h-13 items-center gap-2 rounded-full bg-brand px-5 font-extrabold text-white shadow-[0_8px_20px_rgba(124,65,241,0.35)] md:right-[calc(50%-20rem)]"
      >
        <PlusIcon /> Add design
      </Link>
    </div>
  );
}
