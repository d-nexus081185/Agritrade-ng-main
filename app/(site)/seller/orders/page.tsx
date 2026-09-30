import Link from "next/link";
import { PageHead } from "@/components/layout/DashboardShell";
import { StatusTabs } from "@/components/dashboard/StatusTabs";
import { OrderList } from "@/components/orders/OrderList";
import { EmptyState, Notice, StatCard } from "@/components/ui/States";
import { requireSeller } from "@/lib/auth/session";
import { ESCROW_HELD_STATUSES, ORDER_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Orders & payouts" };

export default async function SellerOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { profile } = await requireSeller();
  const { status } = await searchParams;
  const filter = ORDER_STATUSES.find((s) => s === status);

  const [rows, held, pending, paid] = await Promise.all([
    db.order.findMany({
      where: { sellerId: profile.id, status: filter },
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: { buyer: { select: { name: true, companyName: true } } },
    }),
    db.order.aggregate({ where: { sellerId: profile.id, status: { in: [...ESCROW_HELD_STATUSES] } }, _sum: { sellerAmount: true } }),
    db.order.aggregate({ where: { sellerId: profile.id, status: "COMPLETED", payoutStatus: "PENDING" }, _sum: { sellerAmount: true } }),
    db.order.aggregate({ where: { sellerId: profile.id, payoutStatus: "PAID" }, _sum: { sellerAmount: true } }),
  ]);

  return (
    <>
      {!profile.payoutAccountNumber && (
        <Notice tone="warn">
          Add your payout bank account in <Link href="/seller/profile#payout">Seller profile</Link> before sending payment requests.
        </Notice>
      )}
      <PageHead eyebrow="Seller" title="Orders & payouts" description="Buyers pay into AgriTrade escrow. You're paid once they confirm delivery." />
      <div className="stats">
        <StatCard i={0} label="Held in escrow" value={formatPrice(held._sum.sellerAmount ?? 0)} sub="Released when buyers confirm delivery" />
        <StatCard i={1} label="Payout on the way" value={formatPrice(pending._sum.sellerAmount ?? 0)} sub="Released, transfer pending" earth />
        <StatCard i={2} label="Paid out" value={formatPrice(paid._sum.sellerAmount ?? 0)} />
      </div>
      <StatusTabs base="/seller/orders" active={filter} statuses={ORDER_STATUSES} />
      <div className="card card-pad">
        {rows.length ? (
          <OrderList rows={rows.map((r) => ({ ...r, counterpart: r.buyer.companyName ?? r.buyer.name }))} />
        ) : (
          <EmptyState title="No orders here" action={{ href: "/seller/inquiries", label: "Go to inquiries" }}>
            Agree the details with a buyer in an inquiry, then send a payment request from the conversation.
          </EmptyState>
        )}
      </div>
    </>
  );
}
