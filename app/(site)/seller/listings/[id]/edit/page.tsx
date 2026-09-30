import { notFound } from "next/navigation";
import { PageHead } from "@/components/layout/DashboardShell";
import { ListingForm } from "@/components/seller/ListingForm";
import { Notice, StatusBadge } from "@/components/ui/States";
import { requireSeller } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { parseDeliveryOptions } from "@/lib/format";

export const metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireSeller();
  const { id } = await params;
  // Scoped to the seller's own listings: other sellers' IDs simply 404.
  const [listing, categories] = await Promise.all([
    db.product.findFirst({ where: { id, sellerId: profile.id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!listing) notFound();

  return (
    <>
      <PageHead eyebrow="Seller" title="Edit listing" actions={<StatusBadge status={listing.status} />} />
      {listing.status === "REJECTED" && <Notice tone="warn">This listing was rejected. Saving your changes sends it back for review.</Notice>}
      {listing.status === "SUSPENDED" && <Notice tone="error">This listing has been suspended by an admin and is hidden from buyers.</Notice>}
      <ListingForm
        categories={categories}
        initial={{
          id: listing.id,
          title: listing.title,
          categoryId: listing.categoryId,
          description: listing.description,
          unit: listing.unit,
          price: listing.price,
          quantityAvailable: listing.quantityAvailable,
          minOrderQty: listing.minOrderQty,
          availability: listing.availability,
          city: listing.city,
          state: listing.state,
          deliveryOptions: parseDeliveryOptions(listing.deliveryOptions),
          images: listing.images.map((i) => ({ id: i.id, url: i.url })),
        }}
      />
    </>
  );
}
