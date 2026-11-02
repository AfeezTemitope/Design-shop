"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDesign, deleteDesign } from "@/app/admin/actions";
import { cld, isCloudinaryUrl, mediaTypeFromUrl, videoPoster } from "@/lib/cloudinary";
import { CloseIcon, PlayIcon, PlusIcon } from "@/components/icons";

type Media = { url: string; type: "IMAGE" | "VIDEO" };
type Pkg = { name: string; price: string; includes: string };
type Category = { id: string; name: string };

export type DesignFormValue = {
  id?: string;
  title: string;
  description: string;
  categoryId: string;
  pricingType: "FIXED" | "QUOTE";
  startsFrom: number | null;
  depositPercent: number;
  quoteQuestions: string;
  isLive: boolean;
  media: Media[];
  packages: { name: string; price: number; includes: string }[];
};

const field = "min-h-12 w-full rounded-xl border border-field bg-white px-3.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const label = "flex flex-col gap-1.5 text-[13px] font-bold text-body";
const defaultPackages: Pkg[] = [
  { name: "Basic", price: "", includes: "" },
  { name: "Standard", price: "", includes: "" },
  { name: "Premium", price: "", includes: "" },
];

export function DesignForm({ categories, initial }: { categories: Category[]; initial?: DesignFormValue }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [pricingType, setPricingType] = useState<"FIXED" | "QUOTE">(initial?.pricingType ?? "FIXED");
  const [startsFrom, setStartsFrom] = useState(initial?.startsFrom ? String(initial.startsFrom) : "");
  const [deposit, setDeposit] = useState(String(initial?.depositPercent ?? 50));
  const [questions, setQuestions] = useState(initial?.quoteQuestions ?? "");
  const [isLive, setIsLive] = useState(initial?.isLive ?? true);
  const [media, setMedia] = useState<Media[]>(initial?.media ?? []);
  const [packages, setPackages] = useState<Pkg[]>(
    initial?.packages.length ? initial.packages.map((p) => ({ ...p, price: String(p.price) })) : defaultPackages,
  );
  const [pasted, setPasted] = useState("");
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    for (const file of Array.from(files)) {
      setUploading((n) => n + 1);
      try {
        const sig = await fetch("/api/cloudinary/sign", { method: "POST" }).then((r) => r.json());
        if (sig.error) throw new Error(sig.error);
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", sig.apiKey);
        body.append("timestamp", String(sig.timestamp));
        body.append("folder", sig.folder);
        body.append("signature", sig.signature);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message ?? "Upload failed");
        setMedia((m) => [...m, { url: json.secure_url, type: json.resource_type === "video" ? "VIDEO" : "IMAGE" }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function addPasted() {
    const url = pasted.trim();
    if (!isCloudinaryUrl(url)) return setError("Paste a full https://res.cloudinary.com/… link");
    setMedia((m) => [...m, { url, type: mediaTypeFromUrl(url) }]);
    setPasted("");
    setError("");
  }

  const move = (i: number, by: number) =>
    setMedia((m) => {
      const j = i + by;
      if (j < 0 || j >= m.length) return m;
      const next = [...m];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  function submit() {
    setError("");
    const cleanPkgs = packages
      .filter((p) => p.name.trim() && p.price.trim())
      .map((p) => ({ name: p.name.trim(), price: Math.round(Number(p.price)), includes: p.includes.trim() }));
    if (cleanPkgs.some((p) => !Number.isFinite(p.price) || p.price <= 0)) return setError("Prices must be numbers above 0");
    start(async () => {
      const res = await saveDesign({
        id: initial?.id,
        title,
        description,
        categoryId,
        pricingType,
        startsFrom: startsFrom ? Math.round(Number(startsFrom)) : null,
        depositPercent: Math.round(Number(deposit) || 50),
        quoteQuestions: questions,
        isLive,
        media,
        packages: cleanPkgs,
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else setError(res.error);
    });
  }

  const seg = (on: boolean) =>
    `min-h-11 rounded-[10px] text-sm font-extrabold ${on ? "bg-white text-ink shadow-[0_1px_3px_rgba(23,20,31,0.12)]" : "text-muted"}`;

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <section className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-body">Samples (images or videos) · first one is the cover</span>
        <div className="grid grid-cols-4 gap-2">
          {media.map((m, i) => {
            const thumb = m.type === "VIDEO" ? videoPoster(m.url, 200) : cld(m.url, "f_auto,q_auto,w_200,h_200,c_fill");
            return (
              <div key={m.url + i} className="relative aspect-square overflow-hidden rounded-xl bg-brand-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {thumb && <img src={thumb} alt="" className="size-full object-cover" />}
                {m.type === "VIDEO" && <span className="absolute inset-0 flex items-center justify-center text-white"><PlayIcon className="size-5" /></span>}
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand px-1.5 text-[10px] font-black text-white">COVER</span>}
                <button type="button" onClick={() => setMedia((x) => x.filter((_, k) => k !== i))} aria-label={`Remove sample ${i + 1}`} className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-ink/75 text-white">
                  <CloseIcon className="size-4" />
                </button>
                {i > 0 && (
                  <button type="button" onClick={() => move(i, -1)} aria-label="Move earlier" className="absolute bottom-1 left-1 flex size-7 items-center justify-center rounded-full bg-white/90 text-sm font-black">
                    ←
                  </button>
                )}
              </div>
            );
          })}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-[#c9bef0] bg-[#faf7ff] text-xs font-extrabold text-brand-dark">
            <PlusIcon />
            {uploading ? `Uploading ${uploading}…` : "Upload"}
            <input type="file" multiple accept="image/*,video/*" className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          </label>
        </div>
        <div className="flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Cloudinary URL</span>
            <input value={pasted} onChange={(e) => setPasted(e.target.value)} type="url" placeholder="Paste Cloudinary video/image URL" className={field} />
          </label>
          <button type="button" onClick={addPasted} className="min-h-12 rounded-xl bg-brand-soft px-4 font-extrabold text-brand-dark">Add</button>
        </div>
      </section>

      <label className={label}>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Promo flyer" className={field} /></label>
      <label className={label}>
        Category
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={field}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className={label}>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${field} resize-none py-3`} /></label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-bold text-body">How is it priced?</legend>
        <div className="grid grid-cols-2 gap-1.5 rounded-[14px] bg-[#edeaf3] p-1">
          <button type="button" aria-pressed={pricingType === "FIXED"} onClick={() => setPricingType("FIXED")} className={seg(pricingType === "FIXED")}>Fixed price</button>
          <button type="button" aria-pressed={pricingType === "QUOTE"} onClick={() => setPricingType("QUOTE")} className={seg(pricingType === "QUOTE")}>Quote / talk to me</button>
        </div>
      </fieldset>

      {pricingType === "FIXED" ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
          <p className="text-sm text-muted">Customers pick a package and pay a deposit straight away. Leave a row empty to skip it.</p>
          {packages.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 border-b border-line pb-3 last:border-0 last:pb-0">
              <div className="flex gap-2">
                <input aria-label={`Package ${i + 1} name`} value={p.name} onChange={(e) => setPackages((x) => x.map((y, k) => (k === i ? { ...y, name: e.target.value } : y)))} className={`${field} flex-1`} />
                <input aria-label={`Package ${i + 1} price in naira`} value={p.price} inputMode="numeric" placeholder="₦ price" onChange={(e) => setPackages((x) => x.map((y, k) => (k === i ? { ...y, price: e.target.value.replace(/[^\d]/g, "") } : y)))} className={`${field} w-32`} />
              </div>
              <input aria-label={`Package ${i + 1} includes`} value={p.includes} placeholder="What's included, e.g. 2 concepts, 2 revisions" onChange={(e) => setPackages((x) => x.map((y, k) => (k === i ? { ...y, includes: e.target.value } : y)))} className={field} />
            </div>
          ))}
          <label className="flex items-center justify-between gap-3 text-sm font-bold">
            Deposit %
            <input value={deposit} inputMode="numeric" onChange={(e) => setDeposit(e.target.value.replace(/[^\d]/g, ""))} className={`${field} w-24`} />
          </label>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
          <p className="text-sm text-muted">No checkout. Customers send you a brief on WhatsApp and you quote them.</p>
          <label className="flex items-center justify-between gap-3 text-sm font-bold">
            Starts from (₦, optional)
            <input value={startsFrom} inputMode="numeric" onChange={(e) => setStartsFrom(e.target.value.replace(/[^\d]/g, ""))} className={`${field} w-32`} />
          </label>
          <label className={label}>
            Questions to ask the customer
            <textarea value={questions} onChange={(e) => setQuestions(e.target.value)} rows={2} placeholder="What does your business do? Any colors you like? Budget range?" className={`${field} resize-none py-3`} />
          </label>
        </section>
      )}

      <label className="flex min-h-13 items-center justify-between gap-3 rounded-[14px] border border-line bg-white px-4 font-extrabold">
        Show on shop
        <input type="checkbox" checked={isLive} onChange={(e) => setIsLive(e.target.checked)} className="size-5 accent-brand" />
      </label>

      {error && <p role="alert" className="text-sm font-bold text-accent">{error}</p>}

      <button disabled={pending || uploading > 0} className="min-h-14 rounded-2xl bg-brand font-extrabold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save design"}
      </button>
      {initial?.id && (
        <button
          type="button"
          onClick={() => confirm("Delete this design? Orders keep their records.") && start(() => deleteDesign(initial.id!))}
          className="min-h-12 rounded-2xl font-extrabold text-accent"
        >
          Delete design
        </button>
      )}
    </form>
  );
}
