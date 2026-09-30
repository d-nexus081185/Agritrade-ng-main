import { NextResponse, type NextRequest } from "next/server";
import { settlePayment } from "@/lib/orders";
import { appBaseUrl, paystackVerify } from "@/lib/payments";

// Paystack sends the buyer back here after checkout (?reference=…). The redirect itself proves
// nothing, so the transaction is verified server-to-server before the order moves into escrow.
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference") ?? req.nextUrl.searchParams.get("trxref");
  const base = appBaseUrl();
  if (!reference || !process.env.PAYSTACK_SECRET_KEY) return NextResponse.redirect(`${base}/buyer/orders?payment=failed`);

  try {
    const payment = await paystackVerify(reference);
    if (!payment?.orderId) return NextResponse.redirect(`${base}/buyer/orders?payment=failed`);
    const result = await settlePayment({ ...payment, gateway: "PAYSTACK", orderId: payment.orderId });
    const flag = result === "PAID" || result === "ALREADY_RECORDED" ? "paid=1" : "error=late";
    return NextResponse.redirect(`${base}/orders/${payment.orderId}?${flag}`);
  } catch (err) {
    console.error("[payments] callback verification failed", err);
    return NextResponse.redirect(`${base}/buyer/orders?payment=failed`);
  }
}
