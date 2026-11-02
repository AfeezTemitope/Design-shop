"use client";

import { useRef, useState } from "react";
import { MediaView } from "./MediaView";
import { PlayIcon } from "./icons";
import { cld, videoPoster } from "@/lib/cloudinary";

type Item = { id: string; url: string; type: "IMAGE" | "VIDEO" };

export function Gallery({ items, title }: { items: Item[]; title: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (!items.length) return <div className="aspect-[4/5] w-full rounded-[22px] bg-brand-soft" />;

  const goTo = (i: number) => {
    const el = rail.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setIndex(i);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div
          ref={rail}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[22px]"
        >
          {items.map((m, i) => (
            <div key={m.id} className="aspect-[4/5] w-full shrink-0 snap-center bg-brand-soft">
              <MediaView url={m.url} type={m.type} alt={`${title}, sample ${i + 1}`} width={1000} playable priority={i === 0} className="size-full" />
            </div>
          ))}
        </div>
        {items.length > 1 && (
          <span className="pointer-events-none absolute left-3.5 top-3.5 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-extrabold text-white">
            Sample {index + 1} of {items.length}
          </span>
        )}
      </div>

      {items.length > 1 && (
        <div role="group" aria-label="Samples" className="no-scrollbar flex gap-2.5 overflow-x-auto">
          {items.map((m, i) => {
            const thumb = m.type === "VIDEO" ? videoPoster(m.url, 160) : cld(m.url, "f_auto,q_auto,w_160,h_160,c_fill");
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show sample ${i + 1}`}
                aria-pressed={i === index}
                className={`relative size-16 shrink-0 overflow-hidden rounded-[14px] bg-brand-soft ${
                  i === index ? "ring-[2.5px] ring-brand" : "ring-1 ring-line"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {thumb && <img src={thumb} alt="" className="size-full object-cover" loading="lazy" />}
                {m.type === "VIDEO" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/30 text-white">
                    <PlayIcon className="size-5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
