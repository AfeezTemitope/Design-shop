import Link from "next/link";
import { MediaView } from "./MediaView";
import { PlayIcon } from "./icons";
import { naira } from "@/lib/format";

export type CardDesign = {
  slug: string;
  title: string;
  pricingType: "FIXED" | "QUOTE" | "UNIT";
  startsFrom: number | null;
  fromPrice: number | null;
  cover: { url: string; type: "IMAGE" | "VIDEO" } | null;
  sampleCount: number;
};

export function DesignCard({ d, priority }: { d: CardDesign; priority?: boolean }) {
  const price =
    d.pricingType === "QUOTE"
      ? d.startsFrom
        ? `Starts ${naira(d.startsFrom)}`
        : "Price on request"
      : d.fromPrice != null
        ? `From ${naira(d.fromPrice)}${d.pricingType === "UNIT" ? " / pc" : ""}`
        : d.pricingType === "UNIT"
          ? "Price on request"
          : "See packages";

  return (
    <Link
      href={`/d/${d.slug}`}
      className="group flex flex-col overflow-hidden rounded-[18px] border border-line bg-white transition active:scale-[0.98]"
    >
      <div className="relative aspect-square bg-brand-soft">
        {d.cover && (
          <MediaView url={d.cover.url} type={d.cover.type} alt={d.title} width={500} priority={priority} className="size-full" />
        )}
        {d.pricingType === "QUOTE" ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-extrabold text-white">Quote</span>
        ) : d.cover?.type === "VIDEO" ? (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-extrabold text-white">
            <PlayIcon className="size-3" /> Video
          </span>
        ) : null}
        {d.sampleCount > 1 && (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-bold text-white">
            {d.sampleCount} samples
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-3 pb-3 pt-2.5">
        <span className="text-sm font-extrabold leading-snug">{d.title}</span>
        <span className="text-[13px] text-muted">{price}</span>
      </div>
    </Link>
  );
}
