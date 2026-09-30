import Link from "next/link";
import { deleteListingAction, setAvailabilityAction } from "@/app/actions/seller";
import { PageHead } from "@/components/layout/DashboardShell";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ProductImage } from "@/components/market/ProductImage";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, Notice, StatusBadge } from "@/components/ui/States";
import { requireSeller } from "@/lib/auth/session";
import { AVAILABILITY, AVAILABILITY_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatNumber, formatPrice } from "@/lib/format";

export const metadata = { title: "My listings" };

const SAVED_MESSAGES: Record<string, string> = {
  created: "Listing created and sent for review. It will go live once approved.",
  updated: "Listing updated.",
  deleted: "Listing deleted.",
};

export default async function SellerListings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { profile } = await requireSeller();
  const { saved } = await searchParams;
  const listings = await db.product.findMany({
    where: { sellerId: profile.id },
    orderBy: { updatedAt: "desc" },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      category: { select: { name: true } },
      _count: { select: { inquiries: true, savedBy: true } },
    },
  });

  return (
    <>
      {saved && SAVED_MESSAGES[saved] && <Notice>{SAVED_MESSAGES[saved]}</Notice>}
      <PageHead
        eyebrow="Seller"
        title="Listings"
        description="Manage prices, stock and availability. New listings are reviewed before going live."
        actions={<Link href="/seller/listings/new" className="btn"><Icon name="plus" size={16} /> New listing</Link>}
      />
      {listings.length === 0 ? (
        <EmptyState title="You haven't listed anything yet" action={{ href: "/seller/listings/new", label: "Create your first listing" }}>
          Add photos, a price (or “request a quote”), your minimum order and delivery options.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <caption className="sr-only">Your product listings</caption>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Availability</th>
                <th scope="col">Status</th>
                <th scope="col">Activity</th>
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
                        <div className="small muted">{p.category.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{formatPrice(p.price)}{p.price != null && <div className="small muted">per {p.unit}</div>}</td>
                  <td>{formatNumber(p.quantityAvailable)}<div className="small muted">min {formatNumber(p.minOrderQty)}</div></td>
                  <td>
                    <form action={setAvailabilityAction.bind(null, p.id)} className="inline-form">
                      <label className="sr-only" htmlFor={`av-${p.id}`}>Availability for {p.title}</label>
                      <select id={`av-${p.id}`} name="availability" className="select" defaultValue={p.availability}>
                        {AVAILABILITY.map((a) => <option key={a} value={a}>{AVAILABILITY_LABELS[a]}</option>)}
                      </select>
                      <button className="btn btn-secondary btn-sm" type="submit">Update</button>
                    </form>
                  </td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="small muted" style={{ whiteSpace: "nowrap" }}>
                    {p._count.inquiries} inquir{p._count.inquiries === 1 ? "y" : "ies"}<br />{p._count.savedBy} saves
                  </td>
                  <td>
                    <div className="cell-actions">
                      <Link href={`/seller/listings/${p.id}/edit`} className="btn btn-secondary btn-sm"><Icon name="edit" size={15} /> Edit</Link>
                      <form action={deleteListingAction.bind(null, p.id)}>
                        <ConfirmButton message={`Delete “${p.title}”? This cannot be undone.`} className="btn btn-danger-outline btn-sm" label={`Delete ${p.title}`}>
                          <Icon name="trash" size={15} />
                        </ConfirmButton>
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
