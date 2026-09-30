import { PageHead } from "@/components/layout/DashboardShell";
import { ListingForm } from "@/components/seller/ListingForm";
import { requireSeller } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { parseDeliveryOptions } from "@/lib/format";

export const metadata = { title: "New listing" };

export default async function NewListingPage() {
  const { profile } = await requireSeller();
  const categories = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  return (
    <>
      <PageHead eyebrow="Seller" title="New listing" description="Listings are checked by our team before buyers can see them — usually within a day." />
      <ListingForm
        categories={categories}
        initial={{
          title: "",
          categoryId: "",
          description: "",
          unit: "",
          price: null,
          quantityAvailable: 0,
          minOrderQty: 1,
          availability: "IN_STOCK",
          city: profile.city,
          state: profile.state,
          deliveryOptions: parseDeliveryOptions(profile.deliveryOptions),
          images: [],
        }}
      />
    </>
  );
}
