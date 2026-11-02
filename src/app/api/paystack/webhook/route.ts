import { NextResponse } from "next/server";
import { isValidWebhookSignature } from "@/lib/paystack";
import { markDepositPaid } from "@/lib/orders";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!isValidWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(raw) as { event: string; data: { reference: string; amount: number; currency: string; status: string } };
  if (event.event === "charge.success" && event.data.status === "success") {
    await markDepositPaid(event.data.reference, event.data.amount, event.data.currency);
  }
  return NextResponse.json({ received: true });
}
