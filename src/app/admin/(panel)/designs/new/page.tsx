import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DesignForm } from "@/components/admin/DesignForm";
import { BackIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function NewDesign() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="flex min-h-11 items-center gap-1.5 self-start font-bold text-body"><BackIcon /> Designs</Link>
      <h1 className="text-xl font-black">New design</h1>
      {categories.length ? (
        <DesignForm categories={categories} />
      ) : (
        <p className="rounded-2xl border border-line bg-white p-5 text-muted">
          Add a category first. <Link href="/admin/categories" className="font-bold text-brand-dark">Go to categories</Link>
        </p>
      )}
    </div>
  );
}
