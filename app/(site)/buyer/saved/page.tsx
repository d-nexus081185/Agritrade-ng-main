import { PageHead } from "@/components/layout/DashboardShell";
import { ProductGrid } from "@/components/market/ProductCard";
import { EmptyState } from "@/components/ui/States";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { productCardInclude, publicListingWhere } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

export const metadata = { title: "Saved products" };

export default async function SavedProducts() {
  const user = await requireRole("BUYER");
  const [products, viewer, hidden] = await Promise.all([
    db.product.findMany({
      where: { ...publicListingWhere, savedBy: { some: { userId: user.id } } },
      include: productCardInclude,
      orderBy: { updatedAt: "desc" },
    }),
    getViewer(),
    db.savedProduct.count({ where: { userId: user.id, product: { NOT: publicListingWhere } } }),
  ]);

  return (
    <>
      <PageHead eyebrow="Buyer" title="Saved products" description="Products you're keeping an eye on." />
      {hidden > 0 && (
        <p className="alert alert-info" role="status" style={{ marginBottom: 20 }}>
          {hidden} saved listing{hidden > 1 ? "s are" : " is"} temporarily unavailable and hidden.
        </p>
      )}
      {products.length ? (
        <ProductGrid products={products} viewer={viewer} />
      ) : (
        <EmptyState title="Nothing saved yet" action={{ href: "/products", label: "Browse products" }}>
          Use the heart button on any product card to save it for later.
        </EmptyState>
      )}
    </>
  );
}
