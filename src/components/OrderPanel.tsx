"use client";

import { useEffect, useState, useTransition } from "react";
import { createOrder } from "@/app/actions/order";
import { RefUploader } from "./RefUploader";
import { ChatIcon, CloseIcon } from "./icons";
import { depositFor, naira } from "@/lib/format";
import { ORIENTATIONS, lowestUnitPrice, nextTier, unitPriceFor, type Size } from "@/lib/pricing";

type Pkg = { id: string; name: string; price: number; includes: string };
export type OrderDesign = {
  id: string;
  title: string;
  pricingType: "FIXED" | "QUOTE" | "UNIT";
  startsFrom: number | null;
  depositPercent: number;
  quoteQuestions: string;
  packages: Pkg[];
  sizes: Size[];
  minQty: number;
  askOrientation: boolean;
  askDesignReady: boolean;
  designFee: number | null;
};

const field =
  "min-h-12 w-full rounded-xl border border-field bg-white px-3.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const pick = (on: boolean) =>
  `flex min-h-12 flex-col items-center justify-center rounded-[14px] border p-2 text-center ${
    on ? "border-brand bg-brand text-white" : "border-field bg-white text-body"
  }`;

export function OrderPanel({ design }: { design: OrderDesign }) {
  const isUnit = design.pricingType === "UNIT";
  const [open, setOpen] = useState(false);
  const [pkgId, setPkgId] = useState(design.packages[1]?.id ?? design.packages[0]?.id);
  const firstPriced = design.sizes.find((s) => s.tiers.length) ?? design.sizes[0];
  const [sizeName, setSizeName] = useState(firstPriced?.name ?? "");
  const [orientation, setOrientation] = useState<(typeof ORIENTATIONS)[number] | "">("");
  const [qtyText, setQtyText] = useState(String(Math.max(design.minQty, 1)));
  const [designChoice, setDesignChoice] = useState<"ready" | "design" | "">("");
  const [refs, setRefs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  // ---- what the customer is about to pay ----
  const size = design.sizes.find((s) => s.name === sizeName);
  const qty = Math.max(0, Math.floor(Number(qtyText) || 0));
  const sizeIsQuote = isUnit && (!size || size.tiers.length === 0);
  const isQuote = design.pricingType === "QUOTE" || sizeIsQuote;
  const unit = isUnit && size && !sizeIsQuote ? unitPriceFor(size.tiers, qty) : null;
  const fee = isUnit && designChoice === "design" && design.designFee ? design.designFee : 0;
  const pkg = design.packages.find((p) => p.id === pkgId);
  const total = design.pricingType === "FIXED" ? pkg?.price ?? 0 : unit != null ? unit * qty + fee : 0;
  const deposit = depositFor(total, design.depositPercent);
  const cheaper = isUnit && size && !sizeIsQuote ? nextTier(size.tiers, qty) : null;
  const canPay = !isQuote && total > 0 && (!isUnit || (unit != null && qty >= design.minQty));

  const barPrice = (() => {
    if (design.pricingType === "QUOTE") return design.startsFrom ? `From ${naira(design.startsFrom)}` : "Custom quote";
    if (isUnit) {
      const low = lowestUnitPrice(design.sizes);
      return low != null ? `${naira(low)} / piece` : "Custom quote";
    }
    const low = design.packages.length ? Math.min(...design.packages.map((p) => p.price)) : null;
    return low != null ? naira(low) : "—";
  })();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function submit(form: HTMLFormElement, mode: "paystack" | "whatsapp") {
    if (!form.reportValidity()) return;
    if (isUnit && design.askOrientation && !orientation) return setError("Pick portrait or landscape.");
    if (isUnit && design.askDesignReady && !designChoice) return setError("Tell us if your design is ready.");
    if (isUnit && qty < design.minQty) return setError(`Minimum order is ${design.minQty} pieces.`);
    const f = new FormData(form);
    setError("");
    start(async () => {
      const res = await createOrder({
        designId: design.id,
        packageId: pkgId,
        size: isUnit ? sizeName : undefined,
        orientation: isUnit && orientation ? orientation : undefined,
        quantity: isUnit ? qty : undefined,
        designChoice: isUnit && designChoice ? designChoice : undefined,
        mode,
        name: String(f.get("name") ?? ""),
        phone: String(f.get("phone") ?? ""),
        email: String(f.get("email") ?? ""),
        brand: String(f.get("brand") ?? ""),
        details: String(f.get("details") ?? ""),
        references: refs,
      });
      if (res.ok) window.location.href = res.redirectTo;
      else setError(res.error);
    });
  }

  const cta = design.pricingType === "QUOTE" ? "Discuss project" : "Order now";

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5">
          <div className="flex flex-1 flex-col">
            <span className="text-xs font-bold text-muted">{design.pricingType === "QUOTE" ? "Pricing" : "Starts from"}</span>
            <span className="text-lg font-black">{barPrice}</span>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="min-h-13 rounded-2xl bg-brand px-6 py-3.5 text-base font-extrabold text-white active:scale-[0.98]">
            {cta}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 md:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-[26px] bg-white px-5 pb-[max(env(safe-area-inset-bottom),24px)] pt-2.5 md:rounded-[26px] md:pt-6"
          >
            <span className="h-1.5 w-11 self-center rounded-full bg-field md:hidden" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <h2 id="order-title" className="text-lg font-black">{design.pricingType === "QUOTE" ? "Tell me about your project" : "Your order"}</h2>
                <span className="text-[13px] text-muted">{design.title}</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex size-11 items-center justify-center rounded-full bg-[#f2eff7]">
                <CloseIcon />
              </button>
            </div>

            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              {/* ---- fixed packages ---- */}
              {design.pricingType === "FIXED" && design.packages.length > 0 && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-[13px] font-bold text-body">Choose a package</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {design.packages.map((p) => (
                      <button key={p.id} type="button" aria-pressed={p.id === pkgId} onClick={() => setPkgId(p.id)} className={pick(p.id === pkgId)}>
                        <span className="text-sm font-extrabold">{p.name}</span>
                        <span className="text-xs">{naira(p.price)}</span>
                      </button>
                    ))}
                  </div>
                  {pkg?.includes && <p className="text-[13px] leading-relaxed text-muted">{pkg.includes}</p>}
                </fieldset>
              )}

              {/* ---- per-piece: size, orientation, quantity, design ---- */}
              {isUnit && (
                <>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 text-[13px] font-bold text-body">Size</legend>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {design.sizes.map((s) => {
                        const low = s.tiers.length ? Math.min(...s.tiers.map((t) => t.unitPrice)) : null;
                        return (
                          <button key={s.name} type="button" aria-pressed={s.name === sizeName} onClick={() => setSizeName(s.name)} className={pick(s.name === sizeName)}>
                            <span className="text-sm font-extrabold">{s.name}</span>
                            <span className="text-[11px]">{low != null ? `from ${naira(low)}` : "Quote"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {design.askOrientation && (
                    <fieldset className="flex flex-col gap-2">
                      <legend className="mb-2 text-[13px] font-bold text-body">Orientation</legend>
                      <div className="grid grid-cols-2 gap-2">
                        {ORIENTATIONS.map((o) => (
                          <button key={o} type="button" aria-pressed={o === orientation} onClick={() => setOrientation(o)} className={pick(o === orientation)}>
                            <span className="flex items-center gap-2 text-sm font-extrabold">
                              <span aria-hidden className={`inline-block rounded-[3px] border-2 border-current ${o === "Portrait" ? "h-5 w-3.5" : "h-3.5 w-5"}`} />
                              {o}
                            </span>
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  <div className="flex flex-col gap-2">
                    <label htmlFor="qty" className="text-[13px] font-bold text-body">How many pieces?</label>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="Fewer" onClick={() => setQtyText(String(Math.max(design.minQty, qty - 10)))} className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-field text-xl font-black">−</button>
                      <input id="qty" inputMode="numeric" value={qtyText} onChange={(e) => setQtyText(e.target.value.replace(/[^\d]/g, ""))} className={`${field} text-center text-lg font-black`} />
                      <button type="button" aria-label="More" onClick={() => setQtyText(String(qty + 10))} className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-field text-xl font-black">+</button>
                    </div>
                    <div className="no-scrollbar flex gap-2 overflow-x-auto">
                      {[50, 100, 200, 500].filter((n) => n >= design.minQty).map((n) => (
                        <button key={n} type="button" onClick={() => setQtyText(String(n))} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${qty === n ? "border-brand bg-brand-soft text-brand-dark" : "border-field text-body"}`}>
                          {n} pcs
                        </button>
                      ))}
                    </div>
                    {design.minQty > 1 && <span className="text-xs text-muted">Minimum order: {design.minQty} pieces</span>}
                    {cheaper && <span className="text-[13px] font-bold text-brand-dark">Order {cheaper.minQty}+ to pay {naira(cheaper.unitPrice)} each.</span>}
                    {!sizeIsQuote && size && unit == null && qty > 0 && (
                      <span className="text-[13px] font-bold text-accent">Minimum for {size.name} is {Math.min(...size.tiers.map((t) => t.minQty))} pieces.</span>
                    )}
                  </div>

                  {design.askDesignReady && (
                    <fieldset className="flex flex-col gap-2">
                      <legend className="mb-2 text-[13px] font-bold text-body">Do you have a design ready?</legend>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" aria-pressed={designChoice === "ready"} onClick={() => setDesignChoice("ready")} className={pick(designChoice === "ready")}>
                          <span className="text-sm font-extrabold">Yes, I have it</span>
                          <span className="text-[11px]">Upload it below</span>
                        </button>
                        <button type="button" aria-pressed={designChoice === "design"} onClick={() => setDesignChoice("design")} className={pick(designChoice === "design")}>
                          <span className="text-sm font-extrabold">Design it for me</span>
                          <span className="text-[11px]">{design.designFee ? `+ ${naira(design.designFee)}` : "Fee quoted on WhatsApp"}</span>
                        </button>
                      </div>
                    </fieldset>
                  )}

                  {sizeIsQuote && (
                    <p className="rounded-[14px] bg-brand-soft p-3.5 text-sm font-semibold leading-relaxed text-brand-dark">
                      {sizeName || "This size"} is priced on request. Send your details and I&rsquo;ll quote you on WhatsApp.
                    </p>
                  )}
                </>
              )}

              {/* ---- contact ---- */}
              <label className="flex flex-col gap-1.5 text-[13px] font-bold text-body">
                Your name
                <input name="name" required minLength={2} autoComplete="name" className={field} />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-bold text-body">
                WhatsApp number <span className="font-semibold text-muted">(I&rsquo;ll message you here)</span>
                <input name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="0901 234 5678" className={field} />
              </label>
              {!isQuote && (
                <label className="flex flex-col gap-1.5 text-[13px] font-bold text-body">
                  Email <span className="font-semibold text-muted">(for your Paystack receipt)</span>
                  <input name="email" type="email" autoComplete="email" className={field} />
                </label>
              )}
              <label className="flex flex-col gap-1.5 text-[13px] font-bold text-body">
                Business / brand name
                <input name="brand" autoComplete="organization" className={field} />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-bold text-body">
                {design.pricingType === "QUOTE" ? "What are you looking for?" : "Anything else?"}
                <textarea
                  name="details"
                  rows={3}
                  placeholder={
                    design.pricingType === "QUOTE"
                      ? design.quoteQuestions || "Your business, audience, the look you like, budget range…"
                      : isUnit
                        ? "Colors, rope color, deadline, delivery location…"
                        : "Text, colors, size, deadline…"
                  }
                  className={`${field} resize-none py-3`}
                />
              </label>
              <RefUploader value={refs} onChange={setRefs} />

              {canPay && (
                <div className="flex flex-col gap-1.5 rounded-[14px] bg-canvas p-3.5 text-sm">
                  {design.pricingType === "FIXED" && pkg && (
                    <div className="flex justify-between"><span className="text-muted">{pkg.name} package</span><span className="font-bold">{naira(pkg.price)}</span></div>
                  )}
                  {isUnit && unit != null && (
                    <>
                      <div className="flex justify-between"><span className="text-muted">{sizeName}{orientation ? ` ${orientation.toLowerCase()}` : ""} · {qty} × {naira(unit)}</span><span className="font-bold">{naira(unit * qty)}</span></div>
                      {fee > 0 && <div className="flex justify-between"><span className="text-muted">Design fee</span><span className="font-bold">{naira(fee)}</span></div>}
                      {designChoice === "design" && !design.designFee && <div className="flex justify-between"><span className="text-muted">Design fee</span><span className="font-bold">quoted on WhatsApp</span></div>}
                      <div className="flex justify-between"><span className="text-muted">Total</span><span className="font-bold">{naira(total)}</span></div>
                    </>
                  )}
                  <div className="flex justify-between font-black"><span>Deposit today ({design.depositPercent}%)</span><span>{naira(deposit)}</span></div>
                </div>
              )}

              {error && <p role="alert" className="text-sm font-bold text-accent">{error}</p>}

              {canPay && (
                <button type="button" disabled={pending} onClick={(e) => submit(e.currentTarget.form!, "paystack")} className="min-h-14 rounded-2xl bg-brand text-base font-extrabold text-white disabled:opacity-60">
                  {pending ? "Please wait…" : `Pay ${naira(deposit)} deposit with Paystack`}
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={(e) => submit(e.currentTarget.form!, "whatsapp")}
                className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl text-base font-extrabold disabled:opacity-60 ${
                  canPay ? "border-[1.5px] border-brand text-brand" : "bg-brand text-white"
                }`}
              >
                <ChatIcon />
                {isQuote ? "Get a quote on WhatsApp" : "Send order to WhatsApp"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
