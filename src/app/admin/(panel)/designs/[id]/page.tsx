import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DesignForm } from "@/components/admin/DesignForm";
import { BackIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function EditDesign({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [design, categories] = await Promise.all([
    prisma.design.findUnique({
      where: { id },
      include: { media: { orderBy: { sortOrder: "asc" } }, packages: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!design) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="flex min-h-11 items-center gap-1.5 self-start font-bold text-body"><BackIcon /> Designs</Link>
      <h1 className="text-xl font-black">Edit design</h1>
      <DesignForm
        categories={categories}
        initial={{
          id: design.id,
          title: design.title,
          description: design.description,
          categoryId: design.categoryId,
          pricingType: design.pricingType,
          startsFrom: design.startsFrom,
          depositPercent: design.depositPercent,
          quoteQuestions: design.quoteQuestions,
          isLive: design.isLive,
          media: design.media.map((m) => ({ url: m.url, type: m.type })),
          packages: design.packages.map((p) => ({ name: p.name, price: p.price, includes: p.includes })),
        }}
      />
    </div>
  );
}
