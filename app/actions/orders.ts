"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, requireSeller } from "@/lib/auth/session";
import { MAX_ORDER_TOTAL, PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { canPerform, newOrderReference, newPaymentAttemptRef, nextStatus, orderAmounts, statusesFor, type EscrowAction } from "@/lib/escrow";
import { formatPrice } from "@/lib/format";
import { loadInquiryForUser } from "@/lib/inquiries";
import { loadOrderForUser, logEvent, refreshOrderPages, settlePayment } from "@/lib/orders";
import { activeGateway, paystackInitialize, paystackRefund } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import {
  disputeSchema,
  fieldError,
  fieldErrorsOf,
  formToObject,
  offerSchema,
  payoutDetailsSchema,
  payoutRecordSchema,
  type ActionState,
} from "@/lib/validation";

/** Seller issues a payment request from an inquiry. The buyer pays it into AgriTrade escrow. */
export async function createOfferAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = offerSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  const v = parsed.data;

  const { user, inquiry, side } = await loadInquiryForUser(v.inquiryId);
  if (!inquiry || side !== "SELLER") return { ok: false, message: "Only the seller in this conversation can request payment." };
  if (user.status !== "ACTIVE") return { ok: false, message: "Your seller account must be approved before you can take payments." };
  if (inquiry.status === "CLOSED") return { ok: false, message: "Reopen this inquiry before sending a payment request." };

  const profile = await db.sellerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, payoutAccountNumber: true },
  });
  if (!profile?.payoutAccountNumber) {
    return { ok: false, message: "Add the bank account you want to be paid into (Seller profile → Payout account) before requesting payment." };
  }

  const limit = rateLimit(`offer:${user.id}`, 30, 60 * 60 * 1000);
  if (!limit.allowed) return { ok: false, message: "You've sent many payment requests recently. Please try again later." };

  const amounts = orderAmounts(v.quantity, v.unitPrice, v.deliveryFee, PLATFORM_FEE_PERCENT);
  if (amounts.total > MAX_ORDER_TOTAL) {
    return fieldError("quantity", `Orders are limited to ${formatPrice(MAX_ORDER_TOTAL)}. Split this into smaller orders.`, raw);
  }

  const unit = inquiry.product?.unit ?? "unit";
  const reference = newOrderReference();
  const order = await db.$transaction(async (tx) => {
    // A new request replaces any earlier unpaid one in the same conversation.
    const superseded = await tx.order.findMany({ where: { inquiryId: inquiry.id, status: "AWAITING_PAYMENT" }, select: { id: true } });
    if (superseded.length) {
      await tx.order.updateMany({ where: { id: { in: superseded.map((o) => o.id) }, status: "AWAITING_PAYMENT" }, data: { status: "CANCELLED", cancelledAt: new Date() } });
      await tx.orderEvent.createMany({ data: superseded.map((o) => ({ orderId: o.id, actorId: user.id, type: "CANCELLED", note: "Replaced by a new payment request." })) });
    }
    const created = await tx.order.create({
      data: {
        reference,
        inquiryId: inquiry.id,
        productId: inquiry.productId,
        productTitle: inquiry.productTitle,
        unit,
        buyerId: inquiry.buyerId,
        sellerId: profile.id,
        quantity: v.quantity,
        unitPrice: v.unitPrice,
        deliveryFee: v.deliveryFee,
        total: amounts.total,
        platformFee: amounts.platformFee,
        sellerAmount: amounts.sellerAmount,
        deliveryMethod: v.deliveryMethod,
        note: v.note,
        events: { create: { actorId: user.id, type: "CREATED", note: `Payment request for ${formatPrice(amounts.total)}.` } },
      },
    });
    await tx.inquiryMessage.create({
      data: {
        inquiryId: inquiry.id,
        senderId: user.id,
        body: `Payment request ${reference}: ${v.quantity} × ${unit} at ${formatPrice(v.unitPrice)}${v.deliveryFee ? ` + ${formatPrice(v.deliveryFee)} delivery` : ""} = ${formatPrice(amounts.total)}. Pay securely on AgriTrade. Your money is held in escrow until you confirm delivery.`,
      },
    });
    await tx.inquiry.update({ where: { id: inquiry.id }, data: { status: "RESPONDED", updatedAt: new Date() } });
    return created;
  });

  refreshOrderPages(order);
  return { ok: true, message: `Payment request ${reference} sent to the buyer.` };
}

/** Moves an order along one escrow step, guarded by the rules in lib/escrow.ts. */
async function transition(orderId: string, action: EscrowAction, data: Record<string, unknown>, note: string) {
  const { user, order, side } = await loadOrderForUser(orderId);
  if (!order || !canPerform(action, side, order.status)) return null;
  const res = await db.order.updateMany({
    where: { id: order.id, status: { in: statusesFor(action) } },
    data: { status: nextStatus(action), ...data },
  });
  if (!res.count) return null;
  await logEvent(order.id, user.id, action === "CONFIRM" || action === "RELEASE" ? "RELEASED" : nextStatus(action), note);
  refreshOrderPages(order);
  return order;
}

export async function cancelOrderAction(orderId: string): Promise<void> {
  await transition(orderId, "CANCEL", { cancelledAt: new Date() }, "Payment request cancelled before payment.");
}

export async function markShippedAction(orderId: string): Promise<void> {
  await transition(orderId, "SHIP", { shippedAt: new Date() }, "Seller marked the order as dispatched / ready for pickup.");
}

/** The buyer confirms they received the goods: escrow is released to the seller. */
export async function confirmDeliveryAction(orderId: string): Promise<void> {
  const order = await transition(
    orderId,
    "CONFIRM",
    { completedAt: new Date(), payoutStatus: "PENDING" },
    "Buyer confirmed delivery. Escrow released to the seller.",
  );
  if (order) redirect(`/orders/${order.id}?confirmed=1`);
}

export async function openDisputeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = disputeSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  const order = await transition(parsed.data.orderId, "DISPUTE", { disputeReason: parsed.data.reason }, parsed.data.reason);
  if (!order) return { ok: false, message: "This order can't be disputed right now." };
  return { ok: true, message: "Dispute opened. The money stays in escrow while our team reviews it." };
}

/** Buyer starts checkout. The money goes to AgriTrade's gateway account, never to the seller. */
export async function startPaymentAction(orderId: string): Promise<void> {
  const { user, order, side } = await loadOrderForUser(orderId);
  if (!order || !canPerform("PAY", side, order.status)) redirect(`/orders/${orderId}`);

  const gateway = activeGateway();
  if (!gateway) redirect(`/orders/${order.id}?error=unavailable`);

  const limit = rateLimit(`pay:${user.id}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) redirect(`/orders/${order.id}?error=rate`);

  const attemptRef = newPaymentAttemptRef(order.reference);
  await logEvent(order.id, user.id, "CHECKOUT_STARTED", `${gateway === "PAYSTACK" ? "Paystack" : "Test"} checkout started (ref ${attemptRef}).`);

  if (gateway === "TEST") redirect(`/orders/${order.id}/test-checkout?ref=${encodeURIComponent(attemptRef)}`);

  let url: string;
  try {
    url = await paystackInitialize({ email: user.email, amountNaira: order.total, reference: attemptRef, orderId: order.id });
  } catch (err) {
    console.error("[payments] initialize failed", err);
    redirect(`/orders/${order.id}?error=gateway`);
  }
  redirect(url);
}

/** Development-only simulated gateway. Disabled whenever a real gateway is configured or in production. */
export async function completeTestPaymentAction(orderId: string, attemptRef: string): Promise<void> {
  if (activeGateway() !== "TEST") redirect(`/orders/${orderId}`);
  const { order, side } = await loadOrderForUser(orderId);
  if (!order || side !== "BUYER" || !attemptRef.startsWith(order.reference)) redirect(`/orders/${orderId}`);
  const result = await settlePayment({ orderId: order.id, gateway: "TEST", reference: attemptRef, amountKobo: order.total * 100, currency: "NGN" });
  redirect(`/orders/${order.id}?${result === "PAID" || result === "ALREADY_RECORDED" ? "paid=1" : "error=late"}`);
}

/* ---------- Admin: dispute settlement and payouts ---------- */

export async function releaseDisputeAction(orderId: string): Promise<void> {
  await requireRole("ADMIN");
  await transition(orderId, "RELEASE", { completedAt: new Date(), payoutStatus: "PENDING" }, "Admin settled the dispute in the seller's favour. Escrow released.");
}

export async function refundOrderAction(orderId: string): Promise<void> {
  const admin = await requireRole("ADMIN");
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || !canPerform("REFUND", "ADMIN", order.status)) return;

  if (order.paymentProvider === "PAYSTACK" && order.paymentRef) {
    try {
      await paystackRefund(order.paymentRef);
    } catch (err) {
      console.error("[payments] refund failed", err);
      await logEvent(order.id, admin.id, "REFUND_FAILED", `Paystack refund failed: ${err instanceof Error ? err.message : "unknown error"}. Refund from the Paystack dashboard, then retry.`);
      refreshOrderPages(order);
      redirect(`/orders/${order.id}?error=refund`);
    }
  }
  await transition(orderId, "REFUND", { refundedAt: new Date() }, `Admin refunded ${formatPrice(order.total)} to the buyer.`);
}

export async function recordPayoutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireRole("ADMIN");
  const raw = formToObject(formData);
  const parsed = payoutRecordSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  const res = await db.order.updateMany({
    where: { id: parsed.data.orderId, status: "COMPLETED", payoutStatus: "PENDING" },
    data: { payoutStatus: "PAID", payoutRef: parsed.data.payoutRef, paidOutAt: new Date() },
  });
  if (!res.count) return { ok: false, message: "This payout has already been recorded." };
  await logEvent(parsed.data.orderId, admin.id, "PAID_OUT", `Seller paid out (transfer ref ${parsed.data.payoutRef}).`);
  revalidatePath("/admin", "layout");
  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath("/seller", "layout");
  return { ok: true, message: "Payout recorded." };
}

/* ---------- Seller payout account ---------- */

export async function updatePayoutDetailsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireSeller();
  const raw = formToObject(formData);
  const parsed = payoutDetailsSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  await db.sellerProfile.update({ where: { id: profile.id }, data: parsed.data });
  revalidatePath("/seller/profile");
  return { ok: true, message: "Payout account saved. Released escrow payments will be sent here." };
}
