import Link from "next/link";
import { PageHead } from "@/components/layout/DashboardShell";
import { InquiryList } from "@/components/dashboard/InquiryList";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, Notice, StatCard } from "@/components/ui/States";
import { requireSeller } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata = { title: "Seller dashboard" };

export default async function SellerDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { user, profile } = await requireSeller();
  const { welcome } = await searchParams;

  const [byStatus, inquiryCounts, totalSaves, recent, lowStock] = await Promise.all([
    db.product.groupBy({ by: ["status"], where: { sellerId: profile.id }, _count: true }),
    db.inquiry.groupBy({ by: ["status"], where: { sellerId: profile.id }, _count: true }),
    db.savedProduct.count({ where: { product: { sellerId: profile.id } } }),
    db.inquiry.findMany({
      where: { sellerId: profile.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        buyer: { select: { name: true, companyName: true } },
        product: { select: { unit: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true } },
      },
    }),
    db.product.findMany({
      where: { sellerId: profile.id, availability: { in: ["LIMITED", "OUT_OF_STOCK"] } },
      select: { id: true, title: true, availability: true },
      take: 5,
    }),
  ]);
  const listings = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  const inquiries = (s: string) => inquiryCounts.find((b) => b.status === s)?._count ?? 0;
  const totalListings = byStatus.reduce((n, b) => n + b._count, 0);

  return (
    <>
      {welcome && <Notice>Welcome aboard, {user.name.split(" ")[0]}! Add your first listing while our team reviews your seller account.</Notice>}
      {user.status === "PENDING" && (
        <Notice tone="warn">
          Your seller account is awaiting approval. You can create listings now — they&apos;ll become visible to buyers once
          an admin approves your account and each listing.
        </Notice>
      )}
      <PageHead
        eyebrow="Seller dashboard"
        title={profile.businessName}
        description={`${profile.city}, ${profile.state}`}
        actions={
          <>
            <Link href={`/sellers/${profile.slug}`} className="btn btn-secondary">Public profile</Link>
            <Link href="/seller/listings/new" className="btn"><Icon name="plus" size={16} /> New listing</Link>
          </>
        }
      />
      <div className="stats">
        <StatCard i={0} label="Live listings" value={listings("ACTIVE")} sub={`${totalListings} total`} />
        <StatCard i={1} label="Pending review" value={listings("PENDING")} earth />
        <StatCard i={2} label="New inquiries" value={inquiries("OPEN")} sub="Awaiting your reply" />
        <StatCard i={3} label="Times saved" value={totalSaves} sub="By buyers" earth />
      </div>

      <div className="two-col">
        <section className="card card-pad" aria-labelledby="recent-h">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <h2 id="recent-h" style={{ fontSize: "1.25rem", margin: 0 }}>Latest inquiries</h2>
            <Link href="/seller/inquiries" className="small">View all</Link>
          </div>
          {recent.length ? (
            <InquiryList
              rows={recent.map((r) => ({
                id: r.id,
                productTitle: r.productTitle,
                quantity: r.quantity,
                status: r.status,
                updatedAt: r.updatedAt,
                counterpart: r.buyer.companyName ?? r.buyer.name,
                unit: r.product?.unit,
                imageUrl: r.product?.images[0]?.url,
                lastMessage: r.messages[0]?.body.slice(0, 80),
              }))}
            />
          ) : (
            <EmptyState title="No inquiries yet">When buyers contact you about a listing, their messages land here.</EmptyState>
          )}
        </section>

        <section className="card card-pad" aria-labelledby="activity-h">
          <h2 id="activity-h" style={{ fontSize: "1.25rem" }}>Listing activity</h2>
          <ul className="list">
            <li className="list-item"><span className="grow">Responded inquiries</span><strong>{inquiries("RESPONDED")}</strong></li>
            <li className="list-item"><span className="grow">Closed inquiries</span><strong>{inquiries("CLOSED")}</strong></li>
            <li className="list-item"><span className="grow">Rejected or suspended listings</span><strong>{listings("REJECTED") + listings("SUSPENDED")}</strong></li>
          </ul>
          {lowStock.length > 0 && (
            <>
              <h3 style={{ fontSize: "1rem", marginTop: 20 }}>Check your stock levels</h3>
              <ul className="list">
                {lowStock.map((p) => (
                  <li key={p.id} className="list-item">
                    <Link className="title grow truncate" href={`/seller/listings/${p.id}/edit`}>{p.title}</Link>
                    <span className="badge badge-warn">{p.availability === "LIMITED" ? "Limited" : "Out of stock"}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </>
  );
}
