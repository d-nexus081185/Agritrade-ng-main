import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { completeTestPaymentAction } from "@/app/actions/orders";
import { SubmitButton } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { formatPrice } from "@/lib/format";
import { loadOrderForUser } from "@/lib/orders";
import { activeGateway } from "@/lib/payments";

export const metadata = { title: "Test checkout" };

/** Simulated payment page used in development when no Paystack keys are configured. */
export default async function TestCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { id } = await params;
  const { ref } = await searchParams;
  if (activeGateway() !== "TEST") notFound();
  const { order, side } = await loadOrderForUser(id);
  if (!order || side !== "BUYER") notFound();
  if (order.status !== "AWAITING_PAYMENT" || !ref?.startsWith(order.reference)) redirect(`/orders/${order.id}`);

  return (
    <div className="card card-pad test-checkout">
      <p className="eyebrow" style={{ margin: 0 }}><Icon name="lock" size={14} /> Test payment gateway</p>
      <h1 style={{ fontSize: "1.6rem", margin: "6px 0 4px" }}>Pay {formatPrice(order.total)}</h1>
      <p className="muted" style={{ marginTop: 0 }}>Order {order.reference} · {order.productTitle}</p>
      <div className="alert alert-warn" role="note" style={{ margin: "16px 0" }}>
        <Icon name="info" />
        <p>
          Development only. No real money moves. Set <code>PAYSTACK_SECRET_KEY</code> in <code>.env</code> to use real Paystack
          checkout (test or live keys). This page is never available in production.
        </p>
      </div>
      <div className="row">
        <form action={completeTestPaymentAction.bind(null, order.id, ref)}>
          <SubmitButton pendingLabel="Processing…">Simulate successful payment</SubmitButton>
        </form>
        <Link href={`/orders/${order.id}`} className="btn btn-ghost">Cancel</Link>
      </div>
    </div>
  );
}
