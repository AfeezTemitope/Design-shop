import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "../../actions";
import { statusLabels } from "@/lib/orders";
import { naira } from "@/lib/format";
import { toWaNumber, waLink } from "@/lib/site";

export const dynamic = "force-dynamic";

const pill: Record<string, string> = {
  PENDING_PAYMENT: "bg-[#fff1e0] text-[#8a4b00]",
  DEPOSIT_PAID: "bg-[#e3f6ea] text-[#17703a]",
  WHATSAPP_LEAD: "bg-brand-soft text-brand-dark",
  NEEDS_QUOTE: "bg-[#fde8e9] text-[#b3151b]",
  IN_PROGRESS: "bg-[#e8f0fe] text-[#1f4fb8]",
  COMPLETED: "bg-[#f2eff7] text-body",
  CANCELLED: "bg-[#f2eff7] text-muted",
};

export default async function Orders() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-black">Orders</h1>
      {orders.length === 0 && <p className="rounded-2xl border border-line bg-white p-6 text-center text-muted">No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-extrabold">{o.customerName}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${pill[o.status]}`}>{statusLabels[o.status]}</span>
          </div>
          <span className="text-[13px] text-body">
            {o.designTitle}
            {o.packageName ? ` · ${o.packageName}` : ""}
            {o.size ? ` · ${o.size}${o.orientation ? ` ${o.orientation.toLowerCase()}` : ""}` : ""}
            {o.quantity ? ` · ${o.quantity} pcs` : ""}
            {o.amount != null ? ` · ${naira(o.amount)}` : ""}
            {o.deposit != null ? ` (deposit ${naira(o.deposit)})` : ""}
          </span>
          <span className="text-xs text-muted">
            {o.reference} · {o.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })}
          </span>
          <details className="text-sm">
            <summary className="cursor-pointer py-1 font-bold text-brand-dark">View brief</summary>
            <div className="mt-2 flex flex-col gap-1.5 text-body">
              <span>Phone: {o.phone}</span>
              {o.email && <span>Email: {o.email}</span>}
              {o.brand && <span>Brand: {o.brand}</span>}
              {o.designReady !== null && <span>Design: {o.designReady ? "customer has design" : "needs design"}{o.designFee ? ` (+${naira(o.designFee)})` : ""}</span>}
              {o.unitPrice != null && o.quantity != null && <span>Price: {naira(o.unitPrice)} × {o.quantity}</span>}
              {o.details && <p className="whitespace-pre-wrap">{o.details}</p>}
              {o.references.map((r, i) => (
                <a key={r} href={r} target="_blank" rel="noreferrer" className="font-bold text-brand-dark">Reference {i + 1}</a>
              ))}
            </div>
          </details>
          <div className="mt-1 flex gap-2">
            <a href={waLink(`Hi ${o.customerName}, this is Afeez from BelzGraphics about your order ${o.reference}.`, toWaNumber(o.phone))} className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-soft text-sm font-extrabold text-brand-dark">
              Chat customer
            </a>
            <form action={updateOrderStatus.bind(null, o.id)} className="flex flex-1 gap-1.5">
              <label className="sr-only" htmlFor={`st-${o.id}`}>Status</label>
              <select id={`st-${o.id}`} name="status" defaultValue={o.status} className="min-h-11 min-w-0 flex-1 rounded-xl border border-field bg-white px-2 text-sm">
                {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button className="min-h-11 rounded-xl border border-field px-3 text-sm font-bold">Save</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
