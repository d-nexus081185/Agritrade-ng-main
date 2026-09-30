// Payment gateway integration. Buyers pay AgriTrade (never the seller directly); the money is held
// in escrow on the order until the buyer confirms delivery.
//
// - PAYSTACK: used whenever PAYSTACK_SECRET_KEY is set (test keys sk_test_… or live keys sk_live_…).
// - TEST: a built-in simulated checkout for local development only. It is never available in
//   production, so a production deployment without Paystack keys simply can't take payments.
import { createHmac, timingSafeEqual } from "node:crypto";

export type Gateway = "PAYSTACK" | "TEST";

const PAYSTACK_API = "https://api.paystack.co";

export function activeGateway(): Gateway | null {
  if (process.env.PAYSTACK_SECRET_KEY) return "PAYSTACK";
  if (process.env.NODE_ENV !== "production") return "TEST";
  return null;
}

export function appBaseUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export type VerifiedPayment = {
  reference: string;
  amountKobo: number;
  currency: string;
  orderId: string | null;
};

type PaystackResponse<T> = { status: boolean; message: string; data: T };

async function paystack<T>(path: string, init?: { method?: string; body?: unknown }): Promise<PaystackResponse<T>> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as PaystackResponse<T> | null;
  if (!res.ok || !json?.status) throw new Error(`Paystack ${path}: ${json?.message ?? res.statusText}`);
  return json;
}

/** Starts a Paystack checkout and returns the hosted payment page URL. */
export async function paystackInitialize(input: {
  email: string;
  amountNaira: number;
  reference: string;
  orderId: string;
}): Promise<string> {
  const { data } = await paystack<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: {
      email: input.email,
      amount: input.amountNaira * 100,
      currency: "NGN",
      reference: input.reference,
      callback_url: `${appBaseUrl()}/api/payments/paystack/callback`,
      metadata: { orderId: input.orderId },
    },
  });
  return data.authorization_url;
}

/**
 * Asks Paystack whether a transaction succeeded. Never trust the browser redirect or the webhook
 * body alone: the amount and status are always re-checked with Paystack's API.
 */
export async function paystackVerify(reference: string): Promise<VerifiedPayment | null> {
  const { data } = await paystack<{
    status: string;
    reference: string;
    amount: number;
    currency: string;
    metadata: unknown;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (data.status !== "success") return null;
  return { reference: data.reference, amountKobo: data.amount, currency: data.currency, orderId: metadataOrderId(data.metadata) };
}

/** Full refund of a Paystack transaction back to the buyer's card or account. */
export async function paystackRefund(reference: string): Promise<void> {
  await paystack("/refund", { method: "POST", body: { transaction: reference } });
}

/** Checks the `x-paystack-signature` header (HMAC-SHA512 of the raw body with the secret key). */
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Paystack returns metadata as an object, or as a JSON string on some integrations. */
export function metadataOrderId(metadata: unknown): string | null {
  let m = metadata;
  if (typeof m === "string") {
    try {
      m = JSON.parse(m);
    } catch {
      return null;
    }
  }
  const id = m && typeof m === "object" ? (m as Record<string, unknown>).orderId : null;
  return typeof id === "string" && id ? id : null;
}
