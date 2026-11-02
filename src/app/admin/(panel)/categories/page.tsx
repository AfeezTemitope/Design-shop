import { prisma } from "@/lib/prisma";
import { addCategory, deleteCategory, moveCategory, renameCategory } from "../../actions";
import { TrashIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function Categories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { designs: true } } },
  });

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-black">Categories</h1>
      <form action={addCategory} className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">New category name</span>
          <input name="name" required minLength={2} maxLength={40} placeholder="New category, e.g. Packaging" className="min-h-12 w-full rounded-[14px] border border-field bg-white px-3.5 outline-none focus:border-brand" />
        </label>
        <button className="min-h-12 rounded-[14px] bg-brand px-5 font-extrabold text-white">Add</button>
      </form>
      <p className="text-[13px] text-muted">These show as filter chips on the shop, in this order.</p>

      {categories.map((c, i) => {
        const n = c._count.designs;
        return (
          <div key={c.id} className="flex items-center gap-2 rounded-2xl border border-line bg-white p-2.5 pl-3">
            <div className="flex flex-col">
              <form action={moveCategory.bind(null, c.id, "up")}>
                <button disabled={i === 0} aria-label={`Move ${c.name} up`} className="flex size-8 items-center justify-center rounded-lg text-muted disabled:opacity-30">▲</button>
              </form>
              <form action={moveCategory.bind(null, c.id, "down")}>
                <button disabled={i === categories.length - 1} aria-label={`Move ${c.name} down`} className="flex size-8 items-center justify-center rounded-lg text-muted disabled:opacity-30">▼</button>
              </form>
            </div>
            <form action={renameCategory.bind(null, c.id)} className="flex min-w-0 flex-1 flex-col">
              <label className="sr-only" htmlFor={`cat-${c.id}`}>Category name</label>
              <input id={`cat-${c.id}`} name="name" defaultValue={c.name} className="min-h-9 rounded-lg border border-transparent px-1.5 font-extrabold outline-none hover:border-line focus:border-brand" />
              <span className="px-1.5 text-[13px] text-muted">{n === 0 ? "No designs yet" : `${n} design${n > 1 ? "s" : ""}`}</span>
            </form>
            <form action={deleteCategory.bind(null, c.id)}>
              <button
                disabled={n > 0}
                aria-label={`Delete ${c.name}`}
                title={n > 0 ? "Move or delete its designs first" : `Delete ${c.name}`}
                className="flex size-11 items-center justify-center rounded-xl border border-line text-muted disabled:opacity-30"
              >
                <TrashIcon />
              </button>
            </form>
          </div>
        );
      })}
    </div>
  );
}
