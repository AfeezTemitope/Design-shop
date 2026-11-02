"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { initializeTransaction } from "@/lib/paystack";
import { depositFor, naira } from "@/lib/format";
import { isCloudinaryUrl } from "@/lib/cloudinary";
import { site, waLink } from "@/lib/site";

const schema = z.object({
  designId: z.string().min(1),
  packageId: z.string().optional(),
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
    include: { packages: true },
  });
  if (!design) return { ok: false, error: "This design is no longer available." };

  const isQuote = design.pricingType === "QUOTE";
  const pkg = isQuote ? null : design.packages.find((p) => p.id === data.packageId);
  if (!isQuote && !pkg) return { ok: false, error: "Pick a package first." };
  if (isQuote && data.mode === "paystack") return { ok: false, error: "Custom work is quoted on WhatsApp first." };

  const email = data.email || undefined;
  if (data.mode === "paystack" && !z.email().safeParse(email).success) {
    return { ok: false, error: "Enter a valid email for your Paystack receipt." };
  }

  const amount = pkg?.price ?? null;
  const deposit = pkg ? depositFor(pkg.price, design.depositPercent) : null;
  const reference = newReference();

  await prisma.order.create({
    data: {
      reference,
      designId: design.id,
      designTitle: design.title,
      packageName: pkg?.name ?? null,
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
        metadata: { design: design.title, package: pkg?.name, customer: data.name, phone: data.phone },
      });
      return { ok: true, redirectTo: url };
    } catch {
      return { ok: false, error: "Couldn't start the payment. Try again, or send your order on WhatsApp." };
    }
  }

  const lines = [
    isQuote ? `Hi ${site.name}! I'd like to discuss a custom project.` : `Hi ${site.name}! I want to order a design.`,
    `Order ref: ${reference}`,
    `• ${isQuote ? "Service" : "Design"}: ${design.title}`,
    ...(pkg ? [`• Package: ${pkg.name} (${naira(pkg.price)})`] : []),
    `• Name: ${data.name}`,
    ...(data.brand ? [`• Brand: ${data.brand}`] : []),
    ...(data.details ? [`• ${isQuote ? "What I need" : "Details"}: ${data.details}`] : []),
    ...(data.references.length ? [`• References:`, ...data.references] : []),
  ];
  return { ok: true, redirectTo: waLink(lines.join("\n")) };
}
