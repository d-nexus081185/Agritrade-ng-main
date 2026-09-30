import { NextResponse, type NextRequest } from "next/server";
import { settlePayment } from "@/lib/orders";
import { paystackVerify, verifyPaystackSignature } from "@/lib/payments";

// Paystack webhook (set the URL to {APP_URL}/api/payments/paystack/webhook in the Paystack
// dashboard). It catches payments where the buyer closed the tab before being redirected back.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyPaystackSignature(raw, req.headers.get("x-paystack-signature"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad payload", { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    try {
      // Re-verify with the API rather than trusting the payload's amount.
      const payment = await paystackVerify(event.data.reference);
      if (payment?.orderId) await settlePayment({ ...payment, gateway: "PAYSTACK", orderId: payment.orderId });
    } catch (err) {
      console.error("[payments] webhook processing failed", err);
      // A non-2xx response makes Paystack retry later.
      return new NextResponse("Retry", { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
