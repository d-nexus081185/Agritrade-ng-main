import Link from "next/link";
import { deleteListingAsAdminAction, setListingStatusAction } from "@/app/actions/admin";
import { PageHead } from "@/components/layout/DashboardShell";
import { StatusTabs } from "@/components/dashboard/StatusTabs";
import { ProductImage } from "@/components/market/ProductImage";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState, StatusBadge } from "@/components/ui/States";
import { requireRole } from "@/lib/auth/session";
import { LISTING_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Manage listings" };

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireRole("ADMIN");
  const { status } = await searchParams;
  const filter = LISTING_STATUSES.find((s) => s === status);

  const listings = await db.product.findMany({
    where: { status: filter },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      category: { select: { name: true } },
      seller: { select: { businessName: true, user: { select: { status: true } } } },
      _count: { select: { reports: { where: { status: "OPEN" } } } },
    },
  });

  return (
    <>
      <PageHead eyebrow="Admin" title="Listings" description="Approve new listings, suspend problem ones or remove them entirely." />
      <StatusTabs base="/admin/listings" active={filter} statuses={LISTING_STATUSES} />
      {listings.length === 0 ? (
        <EmptyState title="No listings here">Nothing matches this status right now.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <caption className="sr-only">Product listings</caption>
            <thead>
              <tr>
                <th scope="col">Listing</th>
                <th scope="col">Seller</th>
                <th scope="col">Price</th>
                <th scope="col">Status</th>
                <th scope="col">Submitted</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {listings.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-product">
                      <div style={{ position: "relative", width: 52, height: 42, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                        <ProductImage src={p.images[0]?.url} alt="" sizes="52px" />
                      </div>
                      <div>
                        <Link href={`/products/${p.slug}`} style={{ fontWeight: 700 }}>{p.title}</Link>
                        <div className="small muted">{p.category.name}{p.isSample ? " · Sample" : ""}</div>
                        {p._count.reports > 0 && <div className="small" style={{ color: "var(--danger)" }}>{p._count.reports} open report(s)</div>}
                      </div>
                    </div>
                  </td>
                  <td className="small">
                    {p.seller.businessName}
                    {p.seller.user.status !== "ACTIVE" && <div><StatusBadge status={p.seller.user.status} label={`Seller ${p.seller.user.status.toLowerCase()}`} /></div>}
                  </td>
                  <td className="small">{formatPrice(p.price)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="small">{formatDate(p.createdAt)}</td>
                  <td>
                    <div className="cell-actions">
                      {p.status !== "ACTIVE" && (
                        <form action={setListingStatusAction.bind(null, p.id, "ACTIVE")}>
                          <button className="btn btn-sm" type="submit">{p.status === "PENDING" ? "Approve" : "Reinstate"}</button>
                        </form>
                      )}
                      {p.status === "PENDING" && (
                        <form action={setListingStatusAction.bind(null, p.id, "REJECTED")}>
                          <button className="btn btn-secondary btn-sm" type="submit">Reject</button>
                        </form>
                      )}
                      {p.status === "ACTIVE" && (
                        <form action={setListingStatusAction.bind(null, p.id, "SUSPENDED")}>
                          <ConfirmButton message={`Suspend “${p.title}”? It will be hidden from buyers.`} className="btn btn-secondary btn-sm">Suspend</ConfirmButton>
                        </form>
                      )}
                      <form action={deleteListingAsAdminAction.bind(null, p.id)}>
                        <ConfirmButton message={`Remove “${p.title}” permanently?`} className="btn btn-danger-outline btn-sm">Remove</ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
