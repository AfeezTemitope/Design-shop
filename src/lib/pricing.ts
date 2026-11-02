export type Tier = { minQty: number; unitPrice: number };
export type Size = { name: string; tiers: Tier[] };

const sorted = (tiers: Tier[]) => [...tiers].sort((a, b) => a.minQty - b.minQty);

/** Price per piece for a quantity, or null if the quantity is below the first tier. */
export function unitPriceFor(tiers: Tier[], qty: number) {
  let price: number | null = null;
  for (const t of sorted(tiers)) if (qty >= t.minQty) price = t.unitPrice;
  return price;
}

/** The next cheaper tier above this quantity, for "order 100+ to pay ₦1,300 each" hints. */
export function nextTier(tiers: Tier[], qty: number) {
  return sorted(tiers).find((t) => t.minQty > qty) ?? null;
}

export function lowestUnitPrice(sizes: Size[]) {
  const all = sizes.flatMap((s) => s.tiers.map((t) => t.unitPrice));
  return all.length ? Math.min(...all) : null;
}

/** "1–99 pcs", "100+ pcs" */
export function tierLabels(tiers: Tier[]) {
  const s = sorted(tiers);
  return s.map((t, i) => {
    const next = s[i + 1];
    const range = next ? `${t.minQty}–${next.minQty - 1}` : `${t.minQty}+`;
    return { range: `${range} pcs`, unitPrice: t.unitPrice };
  });
}

export const ORIENTATIONS = ["Portrait", "Landscape"] as const;
