"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { initializeTransaction } from "@/lib/paystack";
import { depositFor, naira } from "@/lib/format";
import { isCloudinaryUrl } from "@/lib/cloudinary";
import { ORIENTATIONS, unitPriceFor } from "@/lib/pricing";
import { site, waLink } from "@/lib/site";

const schema = z.object({
  designId: z.string().min(1),
  packageId: z.string().optional(),
  size: z.string().max(40).optional(),
  orientation: z.enum(ORIENTATIONS).optional(),
  quantity: z.number().int().min(1).max(100000).optional(),
  designChoice: z.enum(["ready", "design"]).optional(),
  mode: z.enum(["paystack", "whatsapp"]),
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().min(7, "Enter your WhatsApp number").max(20),
  email: z.string().trim().max(120).optional(),
  brand: z.string().trim().max(120).default(""),
  details: z.string().trim().max(2000).default(""),
  references: z.array(z.string().refine(isCloudinaryUrl)).max(5).default([]),
});

export type OrderResult = { ok: true; redirectTo: string } | { ok: false; error: string };

function newReference() {
  return "BG-" + randomBytes(4).toString("hex").toUpperCase();
}

export async function createOrder(input: z.input<typeof schema>): Promise<OrderResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details" };
  const data = parsed.data;

  const design = await prisma.design.findFirst({
    where: { id: data.designId, isLive: true },
    include: { packages: true, sizes: { include: { tiers: true } } },
  });
  if (!design) return { ok: false, error: "This design is no longer available." };

  // ---- work out what is being ordered and what it costs (always on the server) ----
  let isQuote = design.pricingType === "QUOTE";
  let packageName: string | null = null;
  let size: string | null = null;
  let orientation: string | null = null;
  let quantity: number | null = null;
  let unitPrice: number | null = null;
  let designReady: boolean | null = null;
  let designFee: number | null = null;
  let amount: number | null = null;
  const summary: string[] = [];

  if (design.pricingType === "FIXED") {
    const pkg = design.packages.find((p) => p.id === data.packageId);
    if (!pkg) return { ok: false, error: "Pick a package first." };
    packageName = pkg.name;
    amount = pkg.price;
    summary.push(`• Package: ${pkg.name} (${naira(pkg.price)})`);
  }

  if (design.pricingType === "UNIT") {
    const opt = design.sizes.find((s) => s.name === data.size);
    if (!opt) return { ok: false, error: "Pick a size." };
    size = opt.name;
    if (design.askOrientation) {
      if (!data.orientation) return { ok: false, error: "Pick portrait or landscape." };
      orientation = data.orientation;
    }
    if (design.askDesignReady) {
      if (!data.designChoice) return { ok: false, error: "Tell us if your design is ready." };
      designReady = data.designChoice === "ready";
    }
    quantity = data.quantity ?? null;
    if (!quantity) return { ok: false, error: "Enter how many you need." };
    if (quantity < design.minQty) return { ok: false, error: `Minimum order is ${design.minQty} pieces.` };

    summary.push(`• Size: ${size}${orientation ? ` (${orientation})` : ""}`, `• Quantity: ${quantity} pcs`);
    if (designReady !== null) summary.push(`• Design: ${designReady ? "I have my design ready" : "Please design it for me"}`);

    if (!opt.tiers.length) {
      isQuote = true; // this size is priced on request
    } else {
      unitPrice = unitPriceFor(opt.tiers, quantity);
      if (unitPrice == null) {
        const first = Math.min(...opt.tiers.map((t) => t.minQty));
        return { ok: false, error: `Minimum for ${size} is ${first} pieces.` };
      }
      designFee = designReady === false && design.designFee ? design.designFee : null;
      amount = unitPrice * quantity + (designFee ?? 0);
      summary.push(`• Price: ${naira(unitPrice)} × ${quantity} = ${naira(unitPrice * quantity)}`);
      if (designFee) summary.push(`• Design fee: ${naira(designFee)}`);
      else if (designReady === false) summary.push(`• Design fee: to be quoted`);
      summary.push(`• Total: ${naira(amount)}`);
    }
  }

  if (isQuote && data.mode === "paystack") return { ok: false, error: "This one is quoted on WhatsApp first." };

  const email = data.email || undefined;
  if (data.mode === "paystack" && !z.email().safeParse(email).success) {
    return { ok: false, error: "Enter a valid email for your Paystack receipt." };
  }

  const deposit = amount != null ? depositFor(amount, design.depositPercent) : null;
  const reference = newReference();

  await prisma.order.create({
    data: {
      reference,
      designId: design.id,
      designTitle: design.title,
      packageName,
      size,
      orientation,
      quantity,
      unitPrice,
      designReady,
      designFee,
      amount,
      deposit,
      customerName: data.name,
      phone: data.phone,
      email,
      brand: data.brand,
      details: data.details,
      references: data.references,
      status: data.mode === "paystack" ? "PENDING_PAYMENT" : isQuote ? "NEEDS_QUOTE" : "WHATSAPP_LEAD",
    },
  });

  if (data.mode === "paystack" && deposit && email) {
    try {
      const url = await initializeTransaction({
        email,
        amountKobo: deposit * 100,
        reference,
        callbackUrl: `${site.url}/order/${reference}`,
        metadata: { design: design.title, package: packageName, size, quantity, customer: data.name, phone: data.phone },
      });
      return { ok: true, redirectTo: url };
    } catch {
      return { ok: false, error: "Couldn't start the payment. Try again, or send your order on WhatsApp." };
    }
  }

  const lines = [
    isQuote ? `Hi ${site.name}! I'd like a quote.` : `Hi ${site.name}! I want to order.`,
    `Order ref: ${reference}`,
    `• Item: ${design.title}`,
    ...summary,
    `• Name: ${data.name}`,
    `• WhatsApp: ${data.phone}`,
    ...(data.brand ? [`• Brand: ${data.brand}`] : []),
    ...(data.details ? [`• Notes: ${data.details}`] : []),
    ...(data.references.length ? [`• Files:`, ...data.references] : []),
  ];
  return { ok: true, redirectTo: waLink(lines.join("\n")) };
}
