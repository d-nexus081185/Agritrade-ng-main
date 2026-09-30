// Pure escrow rules: amounts and which state changes are allowed, and by whom. Kept free of
// database and server-only imports so they can be unit tested.
import { randomBytes } from "node:crypto";
import type { OrderStatus } from "./constants";

export function orderAmounts(quantity: number, unitPrice: number, deliveryFee: number, feePercent: number) {
  const subtotal = quantity * unitPrice;
  const total = subtotal + deliveryFee;
  const platformFee = Math.round((total * feePercent) / 100);
  return { subtotal, total, platformFee, sellerAmount: total - platformFee };
}

export type EscrowAction = "PAY" | "CANCEL" | "SHIP" | "CONFIRM" | "DISPUTE" | "RELEASE" | "REFUND";
export type OrderSide = "BUYER" | "SELLER" | "ADMIN";

/** Which side may take each action, and from which statuses. */
const RULES: Record<EscrowAction, { sides: OrderSide[]; from: OrderStatus[]; to: OrderStatus }> = {
  PAY: { sides: ["BUYER"], from: ["AWAITING_PAYMENT"], to: "IN_ESCROW" },
  CANCEL: { sides: ["BUYER", "SELLER"], from: ["AWAITING_PAYMENT"], to: "CANCELLED" },
  SHIP: { sides: ["SELLER"], from: ["IN_ESCROW"], to: "SHIPPED" },
  // Only the buyer can release escrow by confirming delivery.
  CONFIRM: { sides: ["BUYER"], from: ["IN_ESCROW", "SHIPPED"], to: "COMPLETED" },
  DISPUTE: { sides: ["BUYER"], from: ["IN_ESCROW", "SHIPPED"], to: "DISPUTED" },
  // Admin settlement of a dispute.
  RELEASE: { sides: ["ADMIN"], from: ["DISPUTED"], to: "COMPLETED" },
  REFUND: { sides: ["ADMIN"], from: ["DISPUTED"], to: "REFUNDED" },
};

export function canPerform(action: EscrowAction, side: OrderSide | null, status: string): boolean {
  const rule = RULES[action];
  return side !== null && rule.sides.includes(side) && (rule.from as string[]).includes(status);
}

export function nextStatus(action: EscrowAction): OrderStatus {
  return RULES[action].to;
}

export function statusesFor(action: EscrowAction): OrderStatus[] {
  return RULES[action].from;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Human-friendly order number, e.g. AGT-7K2M9QXD (no 0/O/1/I to avoid misreading). */
export function newOrderReference(): string {
  const bytes = randomBytes(8);
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return `AGT-${s}`;
}

/** A fresh gateway reference per payment attempt (gateways reject re-used references). */
export function newPaymentAttemptRef(orderReference: string): string {
  return `${orderReference}-${randomBytes(4).toString("hex")}`;
}
