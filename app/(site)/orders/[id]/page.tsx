import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cancelOrderAction,
  confirmDeliveryAction,
  markShippedAction,
  refundOrderAction,
  releaseDisputeAction,
  startPaymentAction,
} from "@/app/actions/orders";
import { PageHead } from "@/components/layout/DashboardShell";
import { DisputeForm } from "@/components/orders/DisputeForm";
import { EscrowSteps } from "@/components/orders/OrderList";
import { PayoutRecordForm } from "@/components/orders/PayoutForms";
import { ProductImage } from "@/components/market/ProductImage";
import { SubmitButton } from "@/components/ui/Form";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Icon } from "@/components/ui/Icon";
import { Notice, StatusBadge } from "@/components/ui/States";
import { DELIVERY_LABELS, type DeliveryOption } from "@/lib/constants";
import { canPerform } from "@/lib/escrow";
import { formatDate, formatDateTime, formatNumber, formatPrice, titleCase } from "@/lib/format";
import { loadOrderForUser } from "@/lib/orders";
import { activeGateway } from "@/lib/payments";

export const metadata = { title: "Order" };

const ERRORS: Record<string, string> = {
  unavailable: "Online payments aren't set up on this server yet. Please try again later.",
  gateway: "We couldn't reach the payment provider. No money was taken. Please try again.",
  rate: "Too many payment attempts. Please wait a few minutes and try again.",
  late: "Your payment arrived after this order changed. It's been flagged to our team, who will refund you.",
  refund: "The refund failed at the payment provider. Check the order timeline for details.",
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; confirmed?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { order, side } = await loadOrderForUser(id);
  if (!order || !side) notFound();

  const backHref = order.inquiryId && side !== "ADMIN" ? `/inquiries/${order.inquiryId}` : side === "ADMIN" ? "/admin/orders" : `/${side.toLowerCase()}/orders`;
  const onMainPath = ["AWAITING_PAYMENT", "IN_ESCROW", "SHIPPED", "COMPLETED"].includes(order.status);
  const acct = order.seller.payoutAccountNumber;
  const maskedAcct = acct ? `${order.seller.payoutBankName ?? "Bank"} ••••${acct.slice(-4)}` : "no payout account on file";

  return (
    <>
      <Link href={backHref} className="small" style={{ display: "inline-block", marginBottom: 12 }}>
        ← {order.inquiryId && side !== "ADMIN" ? "Back to conversation" : "Back to orders"}
      </Link>
      {sp.paid && order.status === "IN_ESCROW" && <Notice>Payment received. AgriTrade is holding {formatPrice(order.total)} in escrow until you confirm delivery.</Notice>}
      {sp.confirmed && <Notice>Thanks for confirming delivery. The payment has been released to {order.seller.businessName}.</Notice>}
      {sp.error && ERRORS[sp.error] && <Notice tone="error">{ERRORS[sp.error]}</Notice>}

      <PageHead
        eyebrow={`Order ${order.reference} · ${formatDate(order.createdAt)}`}
        title={order.productTitle}
        actions={<StatusBadge status={order.status} />}
      />

      {onMainPath ? (
        <EscrowSteps status={order.status} shipped={Boolean(order.shippedAt)} />
      ) : order.status === "DISPUTED" ? (
        <Notice tone="warn">
          <strong>In dispute.</strong> The payment is frozen in escrow while AgriTrade reviews it. Reason: “{order.disputeReason}”
        </Notice>
      ) : order.status === "REFUNDED" ? (
        <Notice tone="info">This order was refunded to the buyer on {order.refundedAt ? formatDate(order.refundedAt) : "—"}.</Notice>
      ) : (
        <Notice tone="info">This payment request was cancelled{order.paidAt ? "" : " before payment, so no money changed hands"}.</Notice>
      )}

      <div className="two-col">
        <div className="stack" style={{ ["--stack" as string]: "16px" }}>
          <section className="card card-pad" aria-labelledby="summary-h">
            <h2 id="summary-h" style={{ fontSize: "1.1rem" }}>Order summary</h2>
            {order.product && (
              <div className="cell-product" style={{ marginBottom: 14 }}>
                <div style={{ position: "relative", width: 64, height: 50, borderRadius: 8, overflow: "hidden" }}>
                  <ProductImage src={order.product.images[0]?.url} alt="" sizes="64px" />
                </div>
                {order.product.status === "ACTIVE" ? (
                  <Link href={`/products/${order.product.slug}`} style={{ fontWeight: 700 }}>View listing</Link>
                ) : (
                  <span className="muted small">Listing no longer public</span>
                )}
              </div>
            )}
            <table className="amounts">
              <tbody>
                <tr><th scope="row">{formatNumber(order.quantity)} × {order.unit} @ {formatPrice(order.unitPrice)}</th><td>{formatPrice(order.quantity * order.unitPrice)}</td></tr>
                <tr><th scope="row">{DELIVERY_LABELS[order.deliveryMethod as DeliveryOption] ?? order.deliveryMethod}{order.deliveryFee ? " fee" : ""}</th><td>{order.deliveryFee ? formatPrice(order.deliveryFee) : "—"}</td></tr>
                <tr className="total"><th scope="row">Total paid into escrow</th><td>{formatPrice(order.total)}</td></tr>
                {side !== "BUYER" && order.platformFee > 0 && (
                  <>
                    <tr><th scope="row">AgriTrade fee</th><td>−{formatPrice(order.platformFee)}</td></tr>
                    <tr className="total"><th scope="row">Seller receives</th><td>{formatPrice(order.sellerAmount)}</td></tr>
                  </>
                )}
              </tbody>
            </table>
            {order.note && <p className="prose small" style={{ margin: "14px 0 0" }}>Seller&apos;s note: “{order.note}”</p>}
          </section>

          <section className="card card-pad" aria-labelledby="next-h">
            <h2 id="next-h" style={{ fontSize: "1.1rem" }}>{side === "ADMIN" ? "Admin actions" : "What happens next"}</h2>
            <NextStep order={order} side={side} maskedAcct={maskedAcct} />
          </section>
        </div>

        <aside className="stack" style={{ ["--stack" as string]: "16px" }}>
          <div className="card card-pad escrow-card">
            <Icon name="shield" size={22} />
            <div>
              <strong>Protected by AgriTrade escrow</strong>
              <p className="small" style={{ margin: "4px 0 0" }}>
                Buyers pay AgriTrade, not the seller. We release the money only after the buyer confirms delivery.
                Never pay a seller directly, outside AgriTrade. Those payments aren&apos;t protected.
              </p>
            </div>
          </div>

          <div className="card card-pad">
            <h2 style={{ fontSize: "1.1rem" }}>Parties</h2>
            <dl className="facts" style={{ margin: 0 }}>
              <div className="fact"><dt>Seller</dt><dd><Link href={`/sellers/${order.seller.slug}`}>{order.seller.businessName}</Link></dd></div>
              <div className="fact"><dt>Buyer</dt><dd>{order.buyer.companyName ?? order.buyer.name}</dd></div>
            </dl>
          </div>

          <div className="card card-pad">
            <h2 style={{ fontSize: "1.1rem" }}>Timeline</h2>
            <ol className="timeline">
              {order.events.map((ev) => (
                <li key={ev.id}>
                  <strong>{titleCase(ev.type)}</strong>
                  <span className="small muted"> · <time dateTime={ev.createdAt.toISOString()}>{formatDateTime(ev.createdAt)}</time>{ev.actor ? ` · ${ev.actor.name}` : " · Payment gateway"}</span>
                  {ev.note && <p className="small" style={{ margin: "2px 0 0" }}>{ev.note}</p>}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </>
  );
}

type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrderForUser>>["order"]>;

function NextStep({ order, side, maskedAcct }: { order: LoadedOrder; side: "BUYER" | "SELLER" | "ADMIN"; maskedAcct: string }) {
  const can = (a: Parameters<typeof canPerform>[0]) => canPerform(a, side, order.status);
  const payout =
    order.payoutStatus === "PAID"
      ? `${formatPrice(order.sellerAmount)} was paid out on ${order.paidOutAt ? formatDate(order.paidOutAt) : "—"} (ref ${order.payoutRef}).`
      : `${formatPrice(order.sellerAmount)} is being transferred to ${maskedAcct}.`;

  if (side === "BUYER") {
    if (can("PAY")) {
      const gateway = activeGateway();
      return (
        <div className="stack" style={{ ["--stack" as string]: "12px" }}>
          <p style={{ margin: 0 }}>
            Pay <strong>{formatPrice(order.total)}</strong> to AgriTrade. We hold it safely in escrow and only release it to the seller
            after you confirm the goods have arrived.
          </p>
          <div className="row">
            <form action={startPaymentAction.bind(null, order.id)}>
              <SubmitButton pendingLabel="Opening checkout…" disabled={!gateway}><Icon name="lock" size={16} /> Pay {formatPrice(order.total)} securely</SubmitButton>
            </form>
            <form action={cancelOrderAction.bind(null, order.id)}>
              <ConfirmButton message="Decline this payment request?" className="btn btn-ghost">Decline</ConfirmButton>
            </form>
          </div>
          {gateway === "TEST" && <p className="dev-note" style={{ margin: 0 }}>Development mode: no PAYSTACK_SECRET_KEY is set, so a simulated test checkout is used.</p>}
          {!gateway && <p className="small muted" style={{ margin: 0 }}>Online payment isn&apos;t available right now.</p>}
        </div>
      );
    }
    if (can("CONFIRM")) {
      return (
        <div className="stack" style={{ ["--stack" as string]: "12px" }}>
          <p style={{ margin: 0 }}>
            {order.status === "SHIPPED" ? "The seller has dispatched your order. " : "Your payment is held in escrow. "}
            Once you&apos;ve received the goods and are happy with them, confirm delivery to release the payment to the seller.
          </p>
          <form action={confirmDeliveryAction.bind(null, order.id)}>
            <ConfirmButton
              message={`Confirm you received this order? ${formatPrice(order.total)} will be released to ${order.seller.businessName}. This can't be undone.`}
              className="btn"
            >
              <Icon name="check" size={16} /> I received my order: release payment
            </ConfirmButton>
          </form>
          <DisputeForm orderId={order.id} />
        </div>
      );
    }
    if (order.status === "COMPLETED") return <p style={{ margin: 0 }}>You confirmed delivery on {order.completedAt ? formatDate(order.completedAt) : "—"}. The payment was released to the seller.</p>;
    if (order.status === "DISPUTED") return <p style={{ margin: 0 }}>Our team will contact you and the seller. Your money stays in escrow until the dispute is settled.</p>;
    return <p className="muted" style={{ margin: 0 }}>Nothing to do on this order.</p>;
  }

  if (side === "SELLER") {
    if (order.status === "AWAITING_PAYMENT") {
      return (
        <div className="stack" style={{ ["--stack" as string]: "12px" }}>
          <p style={{ margin: 0 }}>Waiting for the buyer to pay into escrow. Don&apos;t release goods until this order shows <strong>Paid · held in escrow</strong>.</p>
          <form action={cancelOrderAction.bind(null, order.id)}>
            <ConfirmButton message="Cancel this payment request?" className="btn btn-ghost btn-sm">Cancel request</ConfirmButton>
          </form>
        </div>
      );
    }
    if (can("SHIP")) {
      return (
        <div className="stack" style={{ ["--stack" as string]: "12px" }}>
          <p style={{ margin: 0 }}>
            The buyer has paid. AgriTrade is holding <strong>{formatPrice(order.total)}</strong> in escrow. Deliver the goods (or have them ready for pickup),
            then mark the order as dispatched. You&apos;ll be paid when the buyer confirms delivery.
          </p>
          <form action={markShippedAction.bind(null, order.id)}>
            <SubmitButton pendingLabel="Saving…"><Icon name="truck" size={16} /> Mark as dispatched</SubmitButton>
          </form>
        </div>
      );
    }
    if (order.status === "SHIPPED") return <p style={{ margin: 0 }}>Dispatched. Waiting for the buyer to confirm delivery, which releases the payment to you.</p>;
    if (order.status === "COMPLETED") return <p style={{ margin: 0 }}>Delivery confirmed. {payout}</p>;
    if (order.status === "DISPUTED") return <p style={{ margin: 0 }}>The buyer reported a problem. AgriTrade will contact you. The payment stays in escrow until it&apos;s settled.</p>;
    return <p className="muted" style={{ margin: 0 }}>Nothing to do on this order.</p>;
  }

  // Admin
  if (order.status === "DISPUTED") {
    return (
      <div className="stack" style={{ ["--stack" as string]: "12px" }}>
        <p style={{ margin: 0 }}>Settle the dispute after speaking to both parties.</p>
        <div className="row">
          <form action={releaseDisputeAction.bind(null, order.id)}>
            <ConfirmButton message={`Release ${formatPrice(order.sellerAmount)} to ${order.seller.businessName}?`} className="btn btn-sm">Release to seller</ConfirmButton>
          </form>
          <form action={refundOrderAction.bind(null, order.id)}>
            <ConfirmButton message={`Refund ${formatPrice(order.total)} to the buyer?`} className="btn btn-danger-outline btn-sm">Refund buyer</ConfirmButton>
          </form>
        </div>
      </div>
    );
  }
  if (order.status === "COMPLETED" && order.payoutStatus === "PENDING") {
    return (
      <div className="stack" style={{ ["--stack" as string]: "12px" }}>
        <p style={{ margin: 0 }}>
          Transfer <strong>{formatPrice(order.sellerAmount)}</strong> to {order.seller.payoutAccountName ?? order.seller.businessName}, {order.seller.payoutBankName ?? "—"} {order.seller.payoutAccountNumber ?? ""}, then record the transfer reference.
        </p>
        <PayoutRecordForm orderId={order.id} />
      </div>
    );
  }
  if (order.status === "COMPLETED") return <p style={{ margin: 0 }}>{payout}</p>;
  return <p className="muted" style={{ margin: 0 }}>No admin action needed. Status: {titleCase(order.status)}.</p>;
}
