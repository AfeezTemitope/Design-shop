"use client";

import { useEffect, useState, useTransition } from "react";
import { createOrder } from "@/app/actions/order";
import { RefUploader } from "./RefUploader";
import { ChatIcon, CloseIcon } from "./icons";
import { depositFor, naira } from "@/lib/format";

type Pkg = { id: string; name: string; price: number; includes: string };
export type OrderDesign = {
  id: string;
  title: string;
  pricingType: "FIXED" | "QUOTE";
  startsFrom: number | null;
  depositPercent: number;
  quoteQuestions: string;
  packages: Pkg[];
};

const field =
  "min-h-12 w-full rounded-xl border border-field bg-white px-3.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function OrderPanel({ design }: { design: OrderDesign }) {
  const isQuote = design.pricingType === "QUOTE";
  const [open, setOpen] = useState(false);
  const [pkgId, setPkgId] = useState(design.packages[1]?.id ?? design.packages[0]?.id);
  const [refs, setRefs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const pkg = design.packages.find((p) => p.id === pkgId);
  const deposit = pkg ? depositFor(pkg.price, design.depositPercent) : 0;
  const lowest = design.packages.length ? Math.min(...design.packages.map((p) => p.price)) : null;

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
    const f = new FormData(form);
    setError("");
    start(async () => {
      const res = await createOrder({
        designId: design.id,
        packageId: pkgId,
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

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5">
          <div className="flex flex-1 flex-col">
            <span className="text-xs font-bold text-muted">{isQuote ? "Pricing" : "Starts from"}</span>
            <span className="text-lg font-black">
              {isQuote ? (design.startsFrom ? `From ${naira(design.startsFrom)}` : "Custom quote") : lowest != null ? naira(lowest) : "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-13 rounded-2xl bg-brand px-6 py-3.5 text-base font-extrabold text-white active:scale-[0.98]"
          >
            {isQuote ? "Discuss project" : "Order now"}
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
                <h2 id="order-title" className="text-lg font-black">{isQuote ? "Tell me about your project" : "Your order"}</h2>
                <span className="text-[13px] text-muted">{design.title}</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex size-11 items-center justify-center rounded-full bg-[#f2eff7]">
                <CloseIcon />
              </button>
            </div>

            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              {!isQuote && design.packages.length > 0 && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-[13px] font-bold text-body">Choose a package</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {design.packages.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={p.id === pkgId}
                        onClick={() => setPkgId(p.id)}
                        className={`flex min-h-15 flex-col justify-center rounded-[14px] border p-2 text-center ${
                          p.id === pkgId ? "border-brand bg-brand text-white" : "border-field bg-white text-body"
                        }`}
                      >
                        <span className="text-sm font-extrabold">{p.name}</span>
                        <span className="text-xs">{naira(p.price)}</span>
                      </button>
                    ))}
                  </div>
                  {pkg?.includes && <p className="text-[13px] leading-relaxed text-muted">{pkg.includes}</p>}
                </fieldset>
              )}

              <label className="flex flex-col gap-1.5 text-[13px] font-bold text-body">
                Your name
                <input name="name" required minLength={2} autoComplete="name" className={field} />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-bold text-body">
                WhatsApp number
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
                {isQuote ? "What are you looking for?" : "What do you want?"}
                <textarea
                  name="details"
                  rows={3}
                  placeholder={isQuote ? design.quoteQuestions || "Your business, audience, the look you like, budget range…" : "Text, colors, size, deadline…"}
                  className={`${field} resize-none py-3`}
                />
              </label>
              <RefUploader value={refs} onChange={setRefs} />

              {!isQuote && pkg && (
                <div className="flex flex-col gap-1.5 rounded-[14px] bg-canvas p-3.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted">{pkg.name} package</span><span className="font-bold">{naira(pkg.price)}</span></div>
                  <div className="flex justify-between font-black"><span>Deposit today ({design.depositPercent}%)</span><span>{naira(deposit)}</span></div>
                </div>
              )}

              {error && <p role="alert" className="text-sm font-bold text-accent">{error}</p>}

              {!isQuote && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={(e) => submit(e.currentTarget.form!, "paystack")}
                  className="min-h-14 rounded-2xl bg-brand text-base font-extrabold text-white disabled:opacity-60"
                >
                  {pending ? "Please wait…" : `Pay ${naira(deposit)} deposit with Paystack`}
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={(e) => submit(e.currentTarget.form!, "whatsapp")}
                className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl text-base font-extrabold disabled:opacity-60 ${
                  isQuote ? "bg-brand text-white" : "border-[1.5px] border-brand text-brand"
                }`}
              >
                <ChatIcon />
                {isQuote ? "Send brief on WhatsApp" : "Send order to WhatsApp"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
