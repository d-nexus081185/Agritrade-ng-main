import { PageHead } from "@/components/layout/DashboardShell";
import { InquiryList } from "@/components/dashboard/InquiryList";
import { StatusTabs } from "@/components/dashboard/StatusTabs";
import { EmptyState } from "@/components/ui/States";
import { requireSeller } from "@/lib/auth/session";
import { INQUIRY_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";

export const metadata = { title: "Buyer inquiries" };

export default async function SellerInquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { profile } = await requireSeller();
  const { status } = await searchParams;
  const filter = INQUIRY_STATUSES.find((s) => s === status);

  const rows = await db.inquiry.findMany({
    where: { sellerId: profile.id, status: filter },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      buyer: { select: { name: true, companyName: true } },
      product: { select: { unit: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true } },
    },
  });

  return (
    <>
      <PageHead eyebrow="Seller" title="Buyer inquiries" description="Reply quickly — buyers usually contact several sellers." />
      <StatusTabs base="/seller/inquiries" active={filter} statuses={INQUIRY_STATUSES} />
      <div className="card card-pad">
        {rows.length ? (
          <InquiryList
            rows={rows.map((r) => ({
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
          <EmptyState title="No inquiries here">Buyer questions and quote requests for your listings will appear in this inbox.</EmptyState>
        )}
      </div>
    </>
  );
}
