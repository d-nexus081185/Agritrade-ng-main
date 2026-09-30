import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { canAccessPath, isProtectedPath } from "@/lib/access";
import { canPerform, newOrderReference, newPaymentAttemptRef, nextStatus, orderAmounts } from "@/lib/escrow";
import { activeGateway, metadataOrderId, verifyPaystackSignature } from "@/lib/payments";
import { offerSchema, payoutDetailsSchema } from "@/lib/validation";

describe("orderAmounts", () => {
  it("adds delivery to the subtotal and deducts the platform fee from the seller's share", () => {
    expect(orderAmounts(10, 4800, 2000, 0)).toEqual({ subtotal: 48000, total: 50000, platformFee: 0, sellerAmount: 50000 });
    expect(orderAmounts(10, 4800, 2000, 2.5)).toEqual({ subtotal: 48000, total: 50000, platformFee: 1250, sellerAmount: 48750 });
  });
});

describe("escrow rules", () => {
  it("only lets the buyer pay, and only while awaiting payment", () => {
    expect(canPerform("PAY", "BUYER", "AWAITING_PAYMENT")).toBe(true);
    expect(canPerform("PAY", "SELLER", "AWAITING_PAYMENT")).toBe(false);
    expect(canPerform("PAY", "BUYER", "IN_ESCROW")).toBe(false);
  });

  it("releases escrow only on buyer confirmation or admin settlement", () => {
    expect(canPerform("CONFIRM", "BUYER", "IN_ESCROW")).toBe(true);
    expect(canPerform("CONFIRM", "BUYER", "SHIPPED")).toBe(true);
    expect(canPerform("CONFIRM", "SELLER", "SHIPPED")).toBe(false);
    expect(canPerform("CONFIRM", "ADMIN", "SHIPPED")).toBe(false);
    expect(canPerform("CONFIRM", "BUYER", "AWAITING_PAYMENT")).toBe(false);
    expect(canPerform("CONFIRM", "BUYER", "DISPUTED")).toBe(false);
    expect(canPerform("RELEASE", "ADMIN", "DISPUTED")).toBe(true);
    expect(canPerform("RELEASE", "ADMIN", "IN_ESCROW")).toBe(false);
    expect(nextStatus("CONFIRM")).toBe("COMPLETED");
  });

  it("can't cancel once money is in escrow; refunds go through an admin dispute", () => {
    expect(canPerform("CANCEL", "SELLER", "IN_ESCROW")).toBe(false);
    expect(canPerform("CANCEL", "BUYER", "AWAITING_PAYMENT")).toBe(true);
    expect(canPerform("REFUND", "ADMIN", "IN_ESCROW")).toBe(false);
    expect(canPerform("REFUND", "ADMIN", "DISPUTED")).toBe(true);
    expect(canPerform("REFUND", "BUYER", "DISPUTED")).toBe(false);
  });

  it("rejects unknown viewers", () => {
    expect(canPerform("SHIP", null, "IN_ESCROW")).toBe(false);
  });
});

describe("references", () => {
  it("creates readable order numbers and unique payment attempts", () => {
    const ref = newOrderReference();
    expect(ref).toMatch(/^AGT-[A-HJ-NP-Z2-9]{8}$/);
    const a = newPaymentAttemptRef(ref);
    expect(a.startsWith(`${ref}-`)).toBe(true);
    expect(a).not.toBe(newPaymentAttemptRef(ref));
  });
});

describe("Paystack helpers", () => {
  const original = process.env.PAYSTACK_SECRET_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = original;
  });

  it("accepts only correctly signed webhooks", () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_example";
    const body = JSON.stringify({ event: "charge.success", data: { reference: "AGT-X-1" } });
    const sig = createHmac("sha512", "sk_test_example").update(body).digest("hex");
    expect(verifyPaystackSignature(body, sig)).toBe(true);
    expect(verifyPaystackSignature(body + " ", sig)).toBe(false);
    expect(verifyPaystackSignature(body, null)).toBe(false);
    expect(verifyPaystackSignature(body, "abc")).toBe(false);
  });

  it("prefers Paystack when a key is configured", () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_example";
    expect(activeGateway()).toBe("PAYSTACK");
  });

  it("reads the order id from object or string metadata", () => {
    expect(metadataOrderId({ orderId: "o1" })).toBe("o1");
    expect(metadataOrderId('{"orderId":"o2"}')).toBe("o2");
    expect(metadataOrderId("not json")).toBeNull();
    expect(metadataOrderId(null)).toBeNull();
  });
});

describe("escrow validation and routing", () => {
  it("validates payment requests", () => {
    const ok = offerSchema.safeParse({ inquiryId: "i1", quantity: "20", unitPrice: "4800", deliveryFee: "", deliveryMethod: "DELIVERY" });
    expect(ok.success && ok.data.deliveryFee).toBe(0);
    expect(offerSchema.safeParse({ inquiryId: "i1", quantity: "0", unitPrice: "4800", deliveryMethod: "DELIVERY" }).success).toBe(false);
    expect(offerSchema.safeParse({ inquiryId: "i1", quantity: "2", unitPrice: "-5", deliveryMethod: "DELIVERY" }).success).toBe(false);
  });

  it("requires a 10-digit NUBAN for payouts", () => {
    const base = { payoutBankName: "Access Bank", payoutAccountName: "Ogun Valley Farms" };
    expect(payoutDetailsSchema.safeParse({ ...base, payoutAccountNumber: "0123456789" }).success).toBe(true);
    expect(payoutDetailsSchema.safeParse({ ...base, payoutAccountNumber: "12345" }).success).toBe(false);
  });

  it("protects order pages", () => {
    expect(isProtectedPath("/orders/abc")).toBe(true);
    expect(canAccessPath("BUYER", "/buyer/orders")).toBe(true);
    expect(canAccessPath("SELLER", "/admin/orders")).toBe(false);
  });
});
