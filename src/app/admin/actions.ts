"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_COOKIE, SESSION_SECONDS, createSessionToken } from "@/lib/session";
import { isCloudinaryUrl } from "@/lib/cloudinary";
import { slugify } from "@/lib/format";

/* ---------- auth ---------- */

export async function login(_: string | undefined, form: FormData) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return "ADMIN_PASSWORD is not set on the server.";
  const given = String(form.get("password") ?? "");
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  if (!timingSafeEqual(a, b)) return "Wrong password.";
  (await cookies()).set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

function refreshShop(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/d/${slug}`);
}

/* ---------- designs ---------- */

const designSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(2, "Add a title").max(80),
    description: z.string().trim().max(1000).default(""),
    categoryId: z.string().min(1, "Pick a category"),
    pricingType: z.enum(["FIXED", "QUOTE"]),
    startsFrom: z.number().int().positive().nullable().default(null),
    depositPercent: z.number().int().min(10).max(100).default(50),
    quoteQuestions: z.string().trim().max(500).default(""),
    isLive: z.boolean().default(true),
    media: z
      .array(z.object({ url: z.string().refine(isCloudinaryUrl, "Media must be a Cloudinary URL"), type: z.enum(["IMAGE", "VIDEO"]) }))
      .min(1, "Add at least one sample")
      .max(20),
    packages: z
      .array(z.object({ name: z.string().trim().min(1).max(40), price: z.number().int().positive(), includes: z.string().trim().max(300).default("") }))
      .max(5),
  })
  .refine((d) => d.pricingType === "QUOTE" || d.packages.length > 0, { message: "Fixed-price designs need at least one package with a price" });

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveDesign(input: z.input<typeof designSchema>): Promise<SaveResult> {
  await requireAdmin();
  const parsed = designSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form" };
  const d = parsed.data;
  const packages = d.pricingType === "FIXED" ? d.packages : [];

  const base = {
    title: d.title,
    description: d.description,
    categoryId: d.categoryId,
    pricingType: d.pricingType,
    startsFrom: d.pricingType === "QUOTE" ? d.startsFrom : null,
    depositPercent: d.depositPercent,
    quoteQuestions: d.quoteQuestions,
    isLive: d.isLive,
  };
  const media = d.media.map((m, i) => ({ url: m.url, type: m.type, sortOrder: i }));
  const pkgs = packages.map((p, i) => ({ ...p, sortOrder: i }));

  let slug: string;
  if (d.id) {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.media.deleteMany({ where: { designId: d.id } });
      await tx.package.deleteMany({ where: { designId: d.id } });
      return tx.design.update({
        where: { id: d.id },
        data: { ...base, media: { create: media }, packages: { create: pkgs } },
      });
    });
    slug = updated.slug;
  } else {
    slug = slugify(d.title) || "design";
    if (await prisma.design.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    await prisma.design.create({ data: { ...base, slug, media: { create: media }, packages: { create: pkgs } } });
  }
  refreshShop(slug);
  return { ok: true };
}

export async function toggleLive(id: string) {
  await requireAdmin();
  const d = await prisma.design.findUnique({ where: { id } });
  if (!d) return;
  await prisma.design.update({ where: { id }, data: { isLive: !d.isLive } });
  refreshShop(d.slug);
}

export async function deleteDesign(id: string) {
  await requireAdmin();
  const d = await prisma.design.delete({ where: { id } });
  refreshShop(d.slug);
  redirect("/admin");
}

/* ---------- categories ---------- */

export async function addCategory(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  if (name.length < 2) return;
  const slug = slugify(name);
  if (await prisma.category.findFirst({ where: { OR: [{ slug }, { name }] } })) return;
  const last = await prisma.category.findFirst({ orderBy: { sortOrder: "desc" } });
  await prisma.category.create({ data: { name, slug, sortOrder: (last?.sortOrder ?? -1) + 1 } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function renameCategory(id: string, form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  if (name.length < 2) return;
  await prisma.category.update({ where: { id }, data: { name } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function moveCategory(id: string, direction: "up" | "down") {
  await requireAdmin();
  const all = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const i = all.findIndex((c) => c.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await prisma.$transaction(all.map((c, k) => prisma.category.update({ where: { id: c.id }, data: { sortOrder: k } })));
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const count = await prisma.design.count({ where: { categoryId: id } });
  if (count > 0) return; // the UI disables this; designs must be moved first
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

/* ---------- orders ---------- */

const statuses = ["PENDING_PAYMENT", "DEPOSIT_PAID", "WHATSAPP_LEAD", "NEEDS_QUOTE", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export async function updateOrderStatus(id: string, form: FormData) {
  await requireAdmin();
  const status = z.enum(statuses).safeParse(form.get("status"));
  if (!status.success) return;
  await prisma.order.update({ where: { id }, data: { status: status.data } });
  revalidatePath("/admin/orders");
}
