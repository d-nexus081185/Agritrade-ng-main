import { PageHead } from "@/components/layout/DashboardShell";
import { CategoryForm, DeleteCategoryButton } from "@/components/admin/CategoryForms";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata = { title: "Product categories" };

export default async function AdminCategories() {
  await requireRole("ADMIN");
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <PageHead eyebrow="Admin" title="Product categories" description="Categories drive marketplace navigation and filters." />
      <div className="two-col">
        <section aria-labelledby="existing-h" className="stack" style={{ ["--stack" as string]: "14px" }}>
          <h2 id="existing-h" style={{ fontSize: "1.2rem" }}>Existing categories ({categories.length})</h2>
          {categories.map((c) => (
            <details key={c.id} className="card card-pad">
              <summary className="row-between" style={{ cursor: "pointer" }}>
                <span><strong>{c.name}</strong> <span className="small muted">/{c.slug} · {c._count.products} listing{c._count.products === 1 ? "" : "s"} · order {c.sortOrder}</span></span>
                <span className="small">Edit</span>
              </summary>
              <div style={{ marginTop: 16 }}>
                <CategoryForm initial={{ id: c.id, name: c.name, description: c.description, imageUrl: c.imageUrl ?? "", sortOrder: c.sortOrder }} />
                <hr className="divider" />
                <DeleteCategoryButton id={c.id} name={c.name} disabled={c._count.products > 0} />
              </div>
            </details>
          ))}
        </section>
        <section className="card card-pad" aria-labelledby="new-h" style={{ alignSelf: "start" }}>
          <h2 id="new-h" style={{ fontSize: "1.2rem" }}>Add a category</h2>
          <CategoryForm initial={{ name: "", description: "", imageUrl: "", sortOrder: categories.length * 10 }} />
        </section>
      </div>
    </>
  );
}
