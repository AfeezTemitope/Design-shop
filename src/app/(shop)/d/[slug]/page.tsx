import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { Gallery } from "@/components/Gallery";
import { OrderPanel } from "@/components/OrderPanel";
import { BackIcon } from "@/components/icons";
import { cld, videoPoster } from "@/lib/cloudinary";
import { naira } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

const getDesign = cache((slug: string) =>
  prisma.design.findFirst({
    where: { slug, isLive: true },
    include: {
      category: true,
      media: { orderBy: { sortOrder: "asc" } },
      packages: { orderBy: { sortOrder: "asc" } },
    },
  }),
);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const d = await getDesign((await params).slug);
  if (!d) return {};
  const cover = d.media[0];
  const image = cover ? (cover.type === "VIDEO" ? videoPoster(cover.url, 1200) : cld(cover.url, "f_jpg,q_auto,w_1200")) : undefined;
  return {
    title: d.title,
    description: d.description || `${d.title} by BelzGraphics`,
    openGraph: image ? { images: [image] } : undefined,
  };
}

export default async function DesignPage({ params }: { params: Params }) {
  const d = await getDesign((await params).slug);
  if (!d) notFound();
  const isQuote = d.pricingType === "QUOTE";

  return (
    <div className="px-5 pt-4 md:grid md:grid-cols-2 md:gap-10 md:pt-8">
      <Link href="/" className="mb-3 flex min-h-11 items-center gap-1.5 self-start font-bold text-body md:col-span-2">
        <BackIcon /> Back to shop
      </Link>

      <Gallery items={d.media} title={d.title} />

      <div className="mt-5 flex flex-col gap-4 md:mt-0">
        <div className="flex flex-col gap-1.5">
          <span
            className={`self-start rounded-full px-2.5 py-1 text-xs font-extrabold ${
              isQuote ? "bg-[#f2eff7] text-ink" : "bg-brand-soft text-brand-dark"
            }`}
          >
            {d.category.name} · {isQuote ? "custom, let’s talk first" : "fixed price"}
          </span>
          <h1 className="mt-1 text-2xl font-black md:text-4xl">{d.title}</h1>
          {d.description && <p className="max-w-prose leading-relaxed text-body">{d.description}</p>}
        </div>

        {isQuote ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
            <span className="font-black">Priced per project</span>
            <p className="text-sm leading-relaxed text-body">
              Every brand is different, so we&rsquo;ll talk through your goals first. You&rsquo;ll get a clear quote before
              any payment.
            </p>
          </div>
        ) : (
          d.packages.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
              <span className="font-black">Packages</span>
              {d.packages.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-extrabold">{p.name}</span>
                    {p.includes && <span className="text-muted">{p.includes}</span>}
                  </div>
                  <strong className="shrink-0">{naira(p.price)}</strong>
                </div>
              ))}
              <p className="border-t border-line pt-3 text-[13px] text-muted">
                Pay {d.depositPercent}% to start, the rest before final files.
              </p>
            </div>
          )
        )}
      </div>

      <OrderPanel
        design={{
          id: d.id,
          title: d.title,
          pricingType: d.pricingType,
          startsFrom: d.startsFrom,
          depositPercent: d.depositPercent,
          quoteQuestions: d.quoteQuestions,
          packages: d.packages.map(({ id, name, price, includes }) => ({ id, name, price, includes })),
        }}
      />
    </div>
  );
}
