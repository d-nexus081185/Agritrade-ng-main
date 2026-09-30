import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/market/ProductCard";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/States";
import { db } from "@/lib/db";
import { deliveryLabel, formatDate, initials } from "@/lib/format";
import { productCardInclude, publicListingWhere } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const s = await db.sellerProfile.findUnique({ where: { slug: (await params).slug }, select: { businessName: true } });
  return { title: s?.businessName ?? "Seller" };
}

export default async function SellerPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [seller, viewer] = await Promise.all([
    db.sellerProfile.findUnique({ where: { slug }, include: { user: { select: { status: true } } } }),
    getViewer(),
  ]);
  if (!seller || seller.user.status !== "ACTIVE") notFound();

  const products = await db.product.findMany({
    where: { ...publicListingWhere, sellerId: seller.id },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <section className="card card-pad grow-in" aria-labelledby="seller-name">
        <div className="seller-card" style={{ alignItems: "flex-start" }}>
          <span className="avatar" aria-hidden="true" style={{ width: 72, height: 72, fontSize: "1.4rem" }}>{initials(seller.businessName)}</span>
          <div style={{ flex: 1 }}>
            <p className="eyebrow" style={{ margin: 0 }}>Wholesale seller</p>
            <h1 id="seller-name" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", margin: "4px 0 8px" }}>{seller.businessName}</h1>
            <div className="row small muted">
              <span><Icon name="pin" size={14} /> {seller.city}, {seller.state}</span>
              <span><Icon name="truck" size={14} /> {deliveryLabel(seller.deliveryOptions)}</span>
              {seller.yearsInBusiness != null && <span><Icon name="clock" size={14} /> {seller.yearsInBusiness} years trading</span>}
              <span>On AgriTrade since {formatDate(seller.createdAt)}</span>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <span className="badge no-dot"><Icon name="shield" size={13} /> Approved seller</span>
            </div>
            {seller.description && <p className="prose" style={{ marginTop: 16, marginBottom: 0 }}>{seller.description}</p>}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="seller-products">
        <div className="section-head"><h2 id="seller-products">Listings ({products.length})</h2></div>
        {products.length ? (
          <ProductGrid products={products} viewer={viewer} />
        ) : (
          <EmptyState title="No live listings right now">This seller has no products available at the moment.</EmptyState>
        )}
      </section>
    </div>
  );
}
