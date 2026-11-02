import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";
import { markDepositPaid } from "@/lib/orders";
import { naira } from "@/lib/format";
import { site, waLink } from "@/lib/site";
import { ChatIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  let order = await prisma.order.findUnique({ where: { reference } });
  if (!order) notFound();

  // Paystack redirects here after checkout; confirm with Paystack in case the webhook is still on its way.
  if (order.status === "PENDING_PAYMENT") {
    const tx = await verifyTransaction(reference).catch(() => null);
    if (tx?.status === "success") order = (await markDepositPaid(reference, tx.amount, tx.currency)) ?? order;
  }

  const paid = order.status === "DEPOSIT_PAID";
  const message = [
    `Hi ${site.name}! ${paid ? "I just paid my deposit." : "About my order:"}`,
    `Order ref: ${order.reference}`,
    `• Item: ${order.designTitle}${order.packageName ? ` (${order.packageName})` : ""}`,
    ...(order.size ? [`• Size: ${order.size}${order.orientation ? ` (${order.orientation})` : ""}`] : []),
    ...(order.quantity ? [`• Quantity: ${order.quantity} pcs`] : []),
    `• Name: ${order.customerName}`,
    ...(order.brand ? [`• Brand: ${order.brand}`] : []),
    ...(order.details ? [`• Details: ${order.details}`] : []),
  ].join("\n");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 pt-14 text-center">
      <span className={`flex size-16 items-center justify-center rounded-full text-3xl ${paid ? "bg-[#e3f6ea] text-[#17703a]" : "bg-brand-soft text-brand"}`} aria-hidden>
        {paid ? "✓" : "…"}
      </span>
      <h1 className="text-2xl font-black">{paid ? "Deposit received. Thank you!" : "Payment not confirmed yet"}</h1>
      <p className="leading-relaxed text-body">
        {paid
          ? `Your ${order.designTitle} order is in. I'll reach out on WhatsApp shortly to get started.`
          : "If you completed payment, give it a minute and refresh. If you didn't, you can try again or send your order on WhatsApp."}
      </p>
      <div className="w-full rounded-2xl border border-line bg-white p-4 text-left text-sm">
        <div className="flex justify-between py-1"><span className="text-muted">Order ref</span><strong>{order.reference}</strong></div>
        <div className="flex justify-between py-1"><span className="text-muted">Design</span><span className="font-bold">{order.designTitle}</span></div>
        {order.packageName && <div className="flex justify-between py-1"><span className="text-muted">Package</span><span className="font-bold">{order.packageName}</span></div>}
        {order.size && <div className="flex justify-between py-1"><span className="text-muted">Size</span><span className="font-bold">{order.size}{order.orientation ? ` · ${order.orientation}` : ""}</span></div>}
        {order.quantity != null && <div className="flex justify-between py-1"><span className="text-muted">Quantity</span><span className="font-bold">{order.quantity} pcs</span></div>}
        {order.amount != null && <div className="flex justify-between py-1"><span className="text-muted">Total</span><span className="font-bold">{naira(order.amount)}</span></div>}
        {order.deposit != null && <div className="flex justify-between py-1"><span className="text-muted">Deposit</span><span className="font-bold">{naira(order.deposit)}</span></div>}
      </div>
      <a href={waLink(message)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand font-extrabold text-white">
        <ChatIcon /> Send details on WhatsApp
      </a>
      <Link href="/" className="min-h-11 py-2 font-bold text-brand-dark">Back to shop</Link>
    </div>
  );
}
