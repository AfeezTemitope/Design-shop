import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DesignCard, type CardDesign } from "@/components/DesignCard";
import { SearchIcon } from "@/components/icons";
import { site, waLink } from "@/lib/site";

export const dynamic = "force-dynamic";

type Search = Promise<{ c?: string; q?: string }>;

export default async function ShopPage({ searchParams }: { searchParams: Search }) {
  const { c, q } = await searchParams;
  const query = q?.trim().slice(0, 60) || undefined;

  const [categories, designs] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.design.findMany({
      where: {
        isLive: true,
        ...(c ? { category: { slug: c } } : {}),
        ...(query ? { title: { contains: query, mode: "insensitive" as const } } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        packages: { select: { price: true } },
        sizes: { select: { tiers: { select: { unitPrice: true } } } },
      },
    }),
  ]);

  const cards: CardDesign[] = designs.map((d) => ({
    slug: d.slug,
    title: d.title,
    pricingType: d.pricingType,
    startsFrom: d.startsFrom,
    fromPrice: (() => {
      const prices =
        d.pricingType === "UNIT" ? d.sizes.flatMap((s) => s.tiers.map((t) => t.unitPrice)) : d.packages.map((p) => p.price);
      return prices.length ? Math.min(...prices) : null;
    })(),
    cover: d.media[0] ? { url: d.media[0].url, type: d.media[0].type } : null,
    sampleCount: d.media.length,
  }));

  const active = categories.find((x) => x.slug === c);
  const chip = (on: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
      on ? "border-brand bg-brand text-white" : "border-field bg-white text-body"
    }`;

  return (
    <div className="flex flex-col gap-5 px-5 pt-5">
      <section className="flex flex-col gap-2.5 rounded-[22px] bg-brand p-6 text-white md:p-10">
        <span className="self-start rounded-full bg-accent px-2.5 py-1 text-xs font-extrabold">Taking orders</span>
        <h1 className="max-w-xl text-[26px] font-black leading-tight md:text-5xl">
          Designs that make your brand look the part.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-white/85 md:text-base">
          Pick a design you like, see more samples, and order in minutes. Need something custom? Let&rsquo;s talk.
        </p>
      </section>

      <form action="/" className="flex min-h-12 items-center gap-2.5 rounded-[14px] border border-line bg-white px-4 text-muted">
        {c && <input type="hidden" name="c" value={c} />}
        <SearchIcon />
        <label htmlFor="q" className="sr-only">Search designs</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search flyers, logos, branding…"
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
        />
      </form>

      <nav aria-label="Categories" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <Link href={query ? `/?q=${encodeURIComponent(query)}` : "/"} className={chip(!c)} aria-current={!c ? "page" : undefined}>
          All
        </Link>
        {categories.map((cat) => {
          const params = new URLSearchParams({ c: cat.slug, ...(query ? { q: query } : {}) });
          return (
            <Link key={cat.id} href={`/?${params}`} className={chip(cat.slug === c)} aria-current={cat.slug === c ? "page" : undefined}>
              {cat.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-black">{active ? active.name : query ? `Results for “${query}”` : "Popular designs"}</h2>
        <span className="text-[13px] text-muted">
          {cards.length} {cards.length === 1 ? "design" : "designs"}
        </span>
      </div>

      {cards.length ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((d, i) => (
            <DesignCard key={d.slug} d={d} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-line bg-white p-8 text-center">
          <p className="font-extrabold">Nothing here yet.</p>
          <p className="text-sm text-muted">Tell me what you need and I&rsquo;ll design it for you.</p>
          <a href={waLink(`Hi ${site.name}, I have a design request`)} className="rounded-2xl bg-brand px-5 py-3 font-extrabold text-white">
            Chat on WhatsApp
          </a>
        </div>
      )}

      <p className="pt-2 text-center text-[13px] text-muted">Secure payments by Paystack · Card, transfer, USSD</p>
    </div>
  );
}
