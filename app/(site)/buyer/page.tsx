import Link from "next/link";
import { PageHead } from "@/components/layout/DashboardShell";
import { InquiryList } from "@/components/dashboard/InquiryList";
import { ProductGrid } from "@/components/market/ProductCard";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, Notice, StatCard } from "@/components/ui/States";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { productCardInclude, publicListingWhere } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

export const metadata = { title: "Buyer dashboard" };

export default async function BuyerDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireRole("BUYER");
  const { welcome } = await searchParams;

  const [counts, recent, saved, viewer] = await Promise.all([
    db.inquiry.groupBy({ by: ["status"], where: { buyerId: user.id }, _count: true }),
    db.inquiry.findMany({
      where: { buyerId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        seller: { select: { businessName: true } },
        product: { select: { unit: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true } },
      },
    }),
    db.product.findMany({
      where: { ...publicListingWhere, savedBy: { some: { userId: user.id } } },
      include: productCardInclude,
      take: 4,
    }),
    getViewer(),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const savedTotal = await db.savedProduct.count({ where: { userId: user.id } });

  return (
    <>
      {welcome && <Notice>Welcome to AgriTrade, {user.name.split(" ")[0]}! Your buyer account is ready — start by browsing products.</Notice>}
      <PageHead
        eyebrow="Buyer dashboard"
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        description={user.companyName ? `Buying for ${user.companyName}` : "Track your inquiries and saved products."}
        actions={<Link href="/products" className="btn"><Icon name="search" size={16} /> Find products</Link>}
      />
      <div className="stats">
        <StatCard i={0} label="Awaiting reply" value={count("OPEN")} sub="Inquiries sent" />
        <StatCard i={1} label="Seller responded" value={count("RESPONDED")} sub="Ready for you to review" earth />
        <StatCard i={2} label="Closed" value={count("CLOSED")} />
        <StatCard i={3} label="Saved products" value={savedTotal} earth />
      </div>

      <div className="stack" style={{ ["--stack" as string]: "28px" }}>
        <section className="card card-pad" aria-labelledby="recent-inq">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <h2 id="recent-inq" style={{ fontSize: "1.25rem", margin: 0 }}>Recent inquiries</h2>
            <Link href="/buyer/inquiries" className="small">View all</Link>
          </div>
          {recent.length ? (
            <InquiryList
              rows={recent.map((r) => ({
                id: r.id,
                productTitle: r.productTitle,
                quantity: r.quantity,
                status: r.status,
                updatedAt: r.updatedAt,
                counterpart: r.seller.businessName,
                unit: r.product?.unit,
                imageUrl: r.product?.images[0]?.url,
                lastMessage: r.messages[0]?.body.slice(0, 80),
              }))}
            />
          ) : (
            <EmptyState title="No inquiries yet" action={{ href: "/products", label: "Browse products" }}>
              Find a product you need and send the seller an inquiry with your quantity.
            </EmptyState>
          )}
        </section>

        <section aria-labelledby="saved-h">
          <div className="section-head" style={{ marginBottom: 16 }}>
            <h2 id="saved-h" style={{ fontSize: "1.25rem", margin: 0 }}>Saved products</h2>
            <Link href="/buyer/saved" className="small">View all</Link>
          </div>
          {saved.length ? (
            <ProductGrid products={saved} viewer={viewer} />
          ) : (
            <EmptyState title="Nothing saved yet">Tap the heart on any product to keep it here for later.</EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
