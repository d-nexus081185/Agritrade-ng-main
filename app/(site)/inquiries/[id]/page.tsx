import Link from "next/link";
import { notFound } from "next/navigation";
import { setInquiryStatusAction } from "@/app/actions/marketplace";
import { PageHead } from "@/components/layout/DashboardShell";
import { MessageForm } from "@/components/dashboard/MessageForm";
import { ProductImage } from "@/components/market/ProductImage";
import { OfferForm } from "@/components/orders/OfferForm";
import { Icon } from "@/components/ui/Icon";
import { Notice, StatusBadge } from "@/components/ui/States";
import { DELIVERY_LABELS, PLATFORM_FEE_PERCENT, type DeliveryOption } from "@/lib/constants";
import { formatDate, formatDateTime, formatNumber, formatPrice, parseDeliveryOptions } from "@/lib/format";
import { loadInquiryForUser } from "@/lib/inquiries";

export const metadata = { title: "Inquiry" };

export default async function InquiryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const { sent } = await searchParams;
  const { user, inquiry, side } = await loadInquiryForUser(id);
  if (!inquiry || !side) notFound();

  const backHref = side === "SELLER" ? "/seller/inquiries" : side === "BUYER" ? "/buyer/inquiries" : "/admin";
  const closed = inquiry.status === "CLOSED";
  const awaitingPayment = inquiry.orders.find((o) => o.status === "AWAITING_PAYMENT");

  return (
    <>
      <Link href={backHref} className="small" style={{ display: "inline-block", marginBottom: 12 }}>← Back to inquiries</Link>
      {sent && <Notice>Your inquiry has been sent to {inquiry.seller.businessName}. You&apos;ll see their reply here.</Notice>}
      {side === "BUYER" && awaitingPayment && (
        <Notice tone="info">
          {inquiry.seller.businessName} sent you a payment request for <strong>{formatPrice(awaitingPayment.total)}</strong>.{" "}
          <Link href={`/orders/${awaitingPayment.id}`}>Review and pay securely →</Link>
        </Notice>
      )}
      <PageHead
        eyebrow={`Inquiry · started ${formatDate(inquiry.createdAt)}`}
        title={inquiry.productTitle}
        actions={<StatusBadge status={inquiry.status} />}
      />

      <div className="two-col">
        <section className="card card-pad" aria-labelledby="thread-h">
          <h2 id="thread-h" className="sr-only">Conversation</h2>
          <div className="thread" aria-live="polite">
            {inquiry.messages.map((m) => {
              const mine = m.sender.id === user.id;
              return (
                <div key={m.id} className={`msg ${mine ? "mine" : "theirs"}`}>
                  <div className="who">
                    {mine ? "You" : m.sender.id === inquiry.seller.userId ? inquiry.seller.businessName : m.sender.name}
                    {" · "}
                    <time dateTime={m.createdAt.toISOString()}>{formatDateTime(m.createdAt)}</time>
                  </div>
                  <p>{m.body}</p>
                </div>
              );
            })}
          </div>
          <hr className="divider" />
          {side === "ADMIN" ? (
            <p className="muted small" style={{ margin: 0 }}>Admins can view conversations for moderation but can&apos;t reply.</p>
          ) : closed ? (
            <div className="row-between">
              <p className="muted" style={{ margin: 0 }}>This inquiry is closed.</p>
              <form action={setInquiryStatusAction.bind(null, inquiry.id, "OPEN")}>
                <button className="btn btn-secondary btn-sm" type="submit">Reopen inquiry</button>
              </form>
            </div>
          ) : (
            <MessageForm inquiryId={inquiry.id} placeholder={side === "SELLER" ? "Reply with price, availability and delivery details…" : "Write a message to the seller…"} />
          )}
        </section>

        <aside className="stack" style={{ ["--stack" as string]: "16px" }}>
          <div className="card card-pad escrow-card">
            <Icon name="shield" size={22} />
            <div>
              <strong>Pay only through AgriTrade</strong>
              <p className="small" style={{ margin: "4px 0 0" }}>
                All payments go through AgriTrade escrow. The seller is paid only after the buyer confirms delivery.
                Never send money directly to a bank account shared in chat. Off-platform payments aren&apos;t protected.
              </p>
            </div>
          </div>

          <section className="card card-pad" aria-labelledby="pay-h">
            <h2 id="pay-h" style={{ fontSize: "1.1rem" }}>Payment</h2>
            {inquiry.orders.length > 0 && (
              <ul className="list" style={{ marginBottom: 12 }}>
                {inquiry.orders.map((o) => (
                  <li key={o.id} className="list-item">
                    <div className="grow">
                      <Link href={`/orders/${o.id}`} className="title">{o.reference}</Link>
                      <div className="small muted">{formatPrice(o.total)} · {formatDate(o.createdAt)}</div>
                    </div>
                    <StatusBadge status={o.status} />
                  </li>
                ))}
              </ul>
            )}
            {side === "SELLER" && !closed ? (
              <>
                <p className="small muted" style={{ marginTop: 0 }}>
                  Agreed on price and quantity? Send a payment request. The buyer pays AgriTrade, and you&apos;re paid when they confirm delivery.
                  {awaitingPayment && " A new request replaces the unpaid one."}
                </p>
                <OfferForm
                  inquiryId={inquiry.id}
                  unit={inquiry.product?.unit ?? "unit"}
                  defaultQuantity={inquiry.quantity}
                  defaultUnitPrice={inquiry.product?.price}
                  defaultDelivery={inquiry.deliveryPreference}
                  deliveryOptions={inquiry.product ? parseDeliveryOptions(inquiry.product.deliveryOptions) : []}
                  feePercent={PLATFORM_FEE_PERCENT}
                />
              </>
            ) : inquiry.orders.length === 0 ? (
              <p className="small muted" style={{ margin: 0 }}>
                {side === "BUYER"
                  ? "Once you agree on the details, the seller sends a payment request here. You pay into AgriTrade escrow."
                  : "No payment requests yet."}
              </p>
            ) : null}
          </section>

          <div className="card card-pad">
            <h2 style={{ fontSize: "1.1rem" }}>Request details</h2>
            {inquiry.product && (
              <div className="cell-product" style={{ marginBottom: 14 }}>
                <div style={{ position: "relative", width: 64, height: 50, borderRadius: 8, overflow: "hidden" }}>
                  <ProductImage src={inquiry.product.images[0]?.url} alt="" sizes="64px" />
                </div>
                <div>
                  {inquiry.product.status === "ACTIVE" ? (
                    <Link href={`/products/${inquiry.product.slug}`} style={{ fontWeight: 700 }}>View listing</Link>
                  ) : (
                    <span className="muted small">Listing no longer public</span>
                  )}
                  <div className="small muted">{formatPrice(inquiry.product.price)}{inquiry.product.price != null && ` / ${inquiry.product.unit}`}</div>
                </div>
              </div>
            )}
            <dl className="facts" style={{ margin: 0 }}>
              <div className="fact"><dt>Quantity</dt><dd>{formatNumber(inquiry.quantity)}{inquiry.product ? ` × ${inquiry.product.unit}` : ""}</dd></div>
              <div className="fact"><dt>Fulfilment</dt><dd>{DELIVERY_LABELS[inquiry.deliveryPreference as DeliveryOption] ?? inquiry.deliveryPreference}</dd></div>
            </dl>
          </div>

          <div className="card card-pad">
            {side === "BUYER" ? (
              <>
                <h2 style={{ fontSize: "1.1rem" }}>Seller</h2>
                <Link href={`/sellers/${inquiry.seller.slug}`} style={{ fontWeight: 700 }}>{inquiry.seller.businessName}</Link>
                {inquiry.seller.phone && <p className="small" style={{ margin: "6px 0 0" }}><Icon name="phone" size={14} /> {inquiry.seller.phone}</p>}
              </>
            ) : (
              <>
                <h2 style={{ fontSize: "1.1rem" }}>Buyer</h2>
                <p style={{ margin: 0, fontWeight: 700 }}>{inquiry.buyer.name}</p>
                {inquiry.buyer.companyName && <p className="small muted" style={{ margin: 0 }}>{inquiry.buyer.companyName}</p>}
                <p className="small" style={{ margin: "8px 0 0" }}><Icon name="mail" size={14} /> <a href={`mailto:${inquiry.buyer.email}`}>{inquiry.buyer.email}</a></p>
                {inquiry.buyer.phone && <p className="small" style={{ margin: "4px 0 0" }}><Icon name="phone" size={14} /> {inquiry.buyer.phone}</p>}
                {inquiry.buyer.city && <p className="small muted" style={{ margin: "4px 0 0" }}><Icon name="pin" size={14} /> {inquiry.buyer.city}{inquiry.buyer.state ? `, ${inquiry.buyer.state}` : ""}</p>}
              </>
            )}
            {side !== "ADMIN" && !closed && (
              <>
                <hr className="divider" style={{ margin: "16px 0" }} />
                <form action={setInquiryStatusAction.bind(null, inquiry.id, "CLOSED")}>
                  <button className="btn btn-ghost btn-sm" type="submit"><Icon name="check" size={15} /> Mark as closed</button>
                </form>
              </>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
