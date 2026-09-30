import { PageHead } from "@/components/layout/DashboardShell";
import { StatusTabs } from "@/components/dashboard/StatusTabs";
import { OrderList } from "@/components/orders/OrderList";
import { EmptyState, Notice } from "@/components/ui/States";
import { requireRole } from "@/lib/auth/session";
import { ORDER_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";

export const metadata = { title: "My orders" };

export default async function BuyerOrders({ searchParams }: { searchParams: Promise<{ status?: string; payment?: string }> }) {
  const user = await requireRole("BUYER");
  const { status, payment } = await searchParams;
  const filter = ORDER_STATUSES.find((s) => s === status);

  const rows = await db.order.findMany({
    where: { buyerId: user.id, status: filter },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { seller: { select: { businessName: true } } },
  });

  return (
    <>
      {payment === "failed" && <Notice tone="error">We couldn&apos;t confirm that payment. If money left your account, it will be matched to your order automatically or refunded.</Notice>}
      <PageHead eyebrow="Buyer" title="My orders" description="Every payment you make is held by AgriTrade in escrow until you confirm delivery." />
      <StatusTabs base="/buyer/orders" active={filter} statuses={ORDER_STATUSES} />
      <div className="card card-pad">
        {rows.length ? (
          <OrderList rows={rows.map((r) => ({ ...r, counterpart: r.seller.businessName }))} />
        ) : (
          <EmptyState title="No orders here" action={{ href: "/buyer/inquiries", label: "Go to my inquiries" }}>
            When a seller sends you a payment request in an inquiry, the order appears here.
          </EmptyState>
        )}
      </div>
    </>
  );
}
