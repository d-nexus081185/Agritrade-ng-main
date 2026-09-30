import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireUser } from "./auth/session";
import type { OrderSide } from "./escrow";
import type { Gateway } from "./payments";

/**
 * Loads an order and works out how the current user relates to it.
 * Buyers and sellers see only their own orders; admins see all of them.
 */
export async function loadOrderForUser(orderId: string) {
  const user = await requireUser();
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      seller: {
        select: {
          userId: true, businessName: true, slug: true,
          payoutBankName: true, payoutAccountNumber: true, payoutAccountName: true,
        },
      },
      buyer: { select: { id: true, name: true, companyName: true, email: true } },
      product: { select: { slug: true, status: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
      events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
    },
  });
  if (!order) return { user, order: null, side: null } as const;
  const side: OrderSide | null =
    order.buyerId === user.id
      ? "BUYER"
      : order.seller.userId === user.id
        ? "SELLER"
        : user.role === "ADMIN"
          ? "ADMIN"
          : null;
  if (!side) return { user, order: null, side: null } as const;
  return { user, order, side } as const;
}

export function refreshOrderPages(order: { id: string; inquiryId: string | null }) {
  revalidatePath(`/orders/${order.id}`);
  if (order.inquiryId) revalidatePath(`/inquiries/${order.inquiryId}`);
  revalidatePath("/buyer", "layout");
  revalidatePath("/seller", "layout");
  revalidatePath("/admin", "layout");
}

export type SettleResult = "PAID" | "ALREADY_RECORDED" | "AMOUNT_MISMATCH" | "NEEDS_REFUND" | "NOT_FOUND";

/**
 * Records a verified gateway payment against an order and moves it into escrow. Idempotent: the
 * Paystack redirect and webhook can both deliver the same payment, in either order.
 *
 * Payments that arrive for an order that can no longer accept them (cancelled meanwhile, or paid
 * twice) are never silently dropped: they are logged and put in front of an admin for a refund.
 */
export async function settlePayment(p: {
  orderId: string;
  gateway: Gateway;
  reference: string;
  amountKobo: number;
  currency: string;
}): Promise<SettleResult> {
  const order = await db.order.findUnique({ where: { id: p.orderId } });
  if (!order) return "NOT_FOUND";
  if (order.paymentRef === p.reference) return "ALREADY_RECORDED";

  if (p.currency !== "NGN" || p.amountKobo !== order.total * 100) {
    await logEvent(order.id, null, "PAYMENT_MISMATCH", `Gateway reported ${p.currency} ${p.amountKobo / 100} (ref ${p.reference}); order total is NGN ${order.total}. Refund required.`);
    refreshOrderPages(order);
    return "AMOUNT_MISMATCH";
  }

  const now = new Date();
  const paid = await db.order.updateMany({
    where: { id: order.id, status: "AWAITING_PAYMENT", paymentRef: null },
    data: { status: "IN_ESCROW", paidAt: now, paymentProvider: p.gateway, paymentRef: p.reference },
  });
  if (paid.count) {
    await logEvent(order.id, null, "PAID", `Payment received and held in escrow (ref ${p.reference}).`);
    refreshOrderPages(order);
    return "PAID";
  }

  // Lost a race with another delivery of the same payment?
  const current = await db.order.findUnique({ where: { id: order.id } });
  if (current?.paymentRef === p.reference) return "ALREADY_RECORDED";

  if (current?.status === "CANCELLED" && !current.paymentRef) {
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "DISPUTED",
        paidAt: now,
        paymentProvider: p.gateway,
        paymentRef: p.reference,
        disputeReason: "Payment arrived after this order was cancelled. An admin will refund the buyer or release it to the seller if both agree to go ahead.",
      },
    });
    await logEvent(order.id, null, "PAID_AFTER_CANCEL", `Payment received after cancellation (ref ${p.reference}); moved to dispute for an admin.`);
  } else {
    await logEvent(order.id, null, "DUPLICATE_PAYMENT", `An extra payment was received (ref ${p.reference}). Refund it to the buyer from the ${p.gateway === "PAYSTACK" ? "Paystack dashboard" : "gateway"}.`);
  }
  refreshOrderPages(order);
  return "NEEDS_REFUND";
}

export async function logEvent(orderId: string, actorId: string | null, type: string, note = "") {
  await db.orderEvent.create({ data: { orderId, actorId, type, note } });
}

/** Payment problems an admin must resolve by hand. */
export const ATTENTION_EVENT_TYPES = ["PAYMENT_MISMATCH", "DUPLICATE_PAYMENT", "REFUND_FAILED"];
