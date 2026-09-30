import { PageHead } from "@/components/layout/DashboardShell";
import { InquiryList } from "@/components/dashboard/InquiryList";
import { StatusTabs } from "@/components/dashboard/StatusTabs";
import { EmptyState } from "@/components/ui/States";
import { requireRole } from "@/lib/auth/session";
import { INQUIRY_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { titleCase } from "@/lib/format";

export const metadata = { title: "My inquiries" };

export default async function BuyerInquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireRole("BUYER");
  const { status } = await searchParams;
  const filter = INQUIRY_STATUSES.find((s) => s === status);

  const rows = await db.inquiry.findMany({
    where: { buyerId: user.id, status: filter },
    orderBy: { updatedAt: "desc" },
    include: {
      seller: { select: { businessName: true } },
      product: { select: { unit: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true } },
    },
  });

  return (
    <>
      <PageHead eyebrow="Buyer" title="My inquiries" description="Every conversation you've started with a seller." />
      <StatusTabs base="/buyer/inquiries" active={filter} statuses={INQUIRY_STATUSES} />
      <div className="card card-pad">
        {rows.length ? (
          <InquiryList
            rows={rows.map((r) => ({
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
          <EmptyState title={filter ? `No ${titleCase(filter).toLowerCase()} inquiries` : "No inquiries yet"} action={{ href: "/products", label: "Browse products" }}>
            When you contact a seller about a product, the conversation will appear here.
          </EmptyState>
        )}
      </div>
    </>
  );
}
