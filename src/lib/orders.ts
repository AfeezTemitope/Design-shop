import "server-only";
import { prisma } from "./prisma";

/** Marks an order's deposit as paid if Paystack confirmed the right amount. Safe to call twice. */
export async function markDepositPaid(reference: string, amountKobo: number, currency: string) {
  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order || order.status !== "PENDING_PAYMENT" || order.deposit == null) return order;
  if (currency !== "NGN" || amountKobo < order.deposit * 100) return order;
  return prisma.order.update({
    where: { reference },
    data: { status: "DEPOSIT_PAID", paidAt: new Date() },
  });
}

export const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  DEPOSIT_PAID: "Deposit paid",
  WHATSAPP_LEAD: "WhatsApp lead",
  NEEDS_QUOTE: "Needs quote",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
