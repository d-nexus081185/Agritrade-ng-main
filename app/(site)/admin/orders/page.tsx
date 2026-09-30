import Link from "next/link";
import { PageHead } from "@/components/layout/DashboardShell";
import { StatusTabs } from "@/components/dashboard/StatusTabs";
import { PayoutRecordForm } from "@/components/orders/PayoutForms";
import { EmptyState, StatCard, StatusBadge } from "@/components/ui/States";
import { requireRole } from "@/lib/auth/session";
import { ESCROW_HELD_STATUSES, ORDER_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateTime, formatPrice, titleCase } from "@/lib/format";
import { ATTENTION_EVENT_TYPES } from "@/lib/orders";

export const metadata = { title: "Orders & escrow" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireRole("ADMIN");
  const { status } = await searchParams;
  const filter = ORDER_STATUSES.find((s) => s === status);

  const [held, payoutsDue, fees, orders, alerts] = await Promise.all([
    db.order.aggregate({ where: { status: { in: [...ESCROW_HELD_STATUSES] } }, _sum: { total: true }, _count: true }),
    db.order.findMany({
      where: { status: "COMPLETED", payoutStatus: "PENDING" },
      orderBy: { completedAt: "asc" },
      include: { seller: { select: { businessName: true, payoutBankName: true, payoutAccountNumber: true, payoutAccountName: true } } },
    }),
    db.order.aggregate({ where: { status: "COMPLETED" }, _sum: { platformFee: true } }),
    db.order.findMany({
      where: { status: filter },
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: { seller: { select: { businessName: true } }, buyer: { select: { name: true } } },
    }),
    db.orderEvent.findMany({
      where: { type: { in: ATTENTION_EVENT_TYPES } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { order: { select: { id: true, reference: true } } },
    }),
  ]);
  const disputes = await db.order.count({ where: { status: "DISPUTED" } });

  return (
    <>
      <PageHead eyebrow="Admin" title="Orders & escrow" description="Money held for buyers, disputes to settle, and payouts owed to sellers." />
      <div className="stats">
        <StatCard i={0} label="Held in escrow" value={formatPrice(held._sum.total ?? 0)} sub={`${held._count} order(s)`} />
        <StatCard i={1} label="Payouts due" value={formatPrice(payoutsDue.reduce((n, o) => n + o.sellerAmount, 0))} sub={`${payoutsDue.length} seller transfer(s)`} earth />
        <StatCard i={2} label="Open disputes" value={disputes} />
        <StatCard i={3} label="Fees earned" value={formatPrice(fees._sum.platformFee ?? 0)} earth />
      </div>

      {alerts.length > 0 && (
        <section className="card card-pad" style={{ marginBottom: 24, borderColor: "#f3c6c2" }} aria-labelledby="alerts-h">
          <h2 id="alerts-h" style={{ fontSize: "1.15rem", color: "var(--danger)" }}>Payment issues needing a manual refund</h2>
          <ul className="list">
            {alerts.map((a) => (
              <li key={a.id} className="list-item">
                <div className="grow">
                  <Link href={`/orders/${a.order.id}`} className="title">{a.order.reference}</Link> <span className="badge badge-danger no-dot">{titleCase(a.type)}</span>
                  <div className="small muted">{a.note} · {formatDateTime(a.createdAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ marginBottom: 28 }} aria-labelledby="payouts-h">
        <h2 id="payouts-h" style={{ fontSize: "1.2rem" }}>Seller payouts due</h2>
        {payoutsDue.length === 0 ? (
          <EmptyState title="No payouts due">Released escrow payments waiting to be transferred to sellers appear here.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <caption className="sr-only">Seller payouts due</caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Seller & bank account</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Released</th>
                  <th scope="col"><span className="sr-only">Record transfer</span></th>
                </tr>
              </thead>
              <tbody>
                {payoutsDue.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/orders/${o.id}`}>{o.reference}</Link><div className="small muted">{o.productTitle}</div></td>
                    <td>
                      <strong>{o.seller.businessName}</strong>
                      <div className="small">
                        {o.seller.payoutAccountNumber
                          ? `${o.seller.payoutAccountName} · ${o.seller.payoutBankName} · ${o.seller.payoutAccountNumber}`
                          : <span style={{ color: "var(--danger)" }}>No payout account on file</span>}
                      </div>
                    </td>
                    <td><strong>{formatPrice(o.sellerAmount)}</strong></td>
                    <td className="small">{o.completedAt ? formatDateTime(o.completedAt) : "—"}</td>
                    <td><PayoutRecordForm orderId={o.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <h2 style={{ fontSize: "1.2rem" }}>All orders</h2>
      <StatusTabs base="/admin/orders" active={filter} statuses={ORDER_STATUSES} />
      {orders.length === 0 ? (
        <EmptyState title="No orders here" />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <caption className="sr-only">Orders</caption>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Buyer → Seller</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/orders/${o.id}`}>{o.reference}</Link><div className="small muted">{o.productTitle}</div></td>
                  <td className="small">{o.buyer.name} → {o.seller.businessName}</td>
                  <td><strong>{formatPrice(o.total)}</strong></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="small">{formatDateTime(o.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
