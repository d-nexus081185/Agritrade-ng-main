"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth/session";
import { publicListingWhere } from "@/lib/queries";
import { loadInquiryForUser } from "@/lib/inquiries";
import { parseDeliveryOptions, formatNumber } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";
import {
  fieldError,
  fieldErrorsOf,
  formToObject,
  inquirySchema,
  messageSchema,
  reportSchema,
  type ActionState,
} from "@/lib/validation";

/** Save / unsave a listing. Buyers only. */
export async function toggleSaveAction(productId: string): Promise<{ saved: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { saved: false, error: "Sign in as a buyer to save products." };
  if (user.role !== "BUYER") return { saved: false, error: "Only buyer accounts can save products." };

  const key = { userId_productId: { userId: user.id, productId } };
  const existing = await db.savedProduct.findUnique({ where: key });
  if (existing) {
    await db.savedProduct.delete({ where: key });
  } else {
    const product = await db.product.findFirst({ where: { id: productId, ...publicListingWhere }, select: { id: true } });
    if (!product) return { saved: false, error: "This listing is no longer available." };
    await db.savedProduct.create({ data: { userId: user.id, productId } });
  }
  revalidatePath("/buyer/saved");
  revalidatePath("/buyer");
  return { saved: !existing };
}

export async function createInquiryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("BUYER");
  const raw = formToObject(formData);
  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  const v = parsed.data;

  const limit = rateLimit(`inquiry:${user.id}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) return { ok: false, message: "You've sent a lot of inquiries recently. Please try again later." };

  const product = await db.product.findFirst({ where: { id: v.productId, ...publicListingWhere } });
  if (!product) return { ok: false, message: "This listing is no longer available." };
  if (product.availability === "OUT_OF_STOCK") return { ok: false, message: "This product is currently out of stock." };
  if (v.quantity < product.minOrderQty) {
    return fieldError("quantity", `The minimum order is ${formatNumber(product.minOrderQty)} × ${product.unit}.`, raw);
  }
  if (!parseDeliveryOptions(product.deliveryOptions).includes(v.deliveryPreference)) {
    return fieldError("deliveryPreference", "Choose an option the seller offers.", raw);
  }

  const inquiry = await db.inquiry.create({
    data: {
      productId: product.id,
      productTitle: product.title,
      buyerId: user.id,
      sellerId: product.sellerId,
      quantity: v.quantity,
      deliveryPreference: v.deliveryPreference,
      messages: { create: { senderId: user.id, body: v.message } },
    },
  });
  revalidatePath("/buyer");
  redirect(`/inquiries/${inquiry.id}?sent=1`);
}

export async function sendMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = messageSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  const { user, inquiry, side } = await loadInquiryForUser(parsed.data.inquiryId);
  if (!inquiry || side === "ADMIN" || !side) return { ok: false, message: "You can't reply to this conversation." };
  if (inquiry.status === "CLOSED") return { ok: false, message: "This inquiry is closed. Reopen it to continue the conversation." };

  const limit = rateLimit(`msg:${user.id}`, 60, 60 * 60 * 1000);
  if (!limit.allowed) return { ok: false, message: "You're sending messages too quickly. Please wait a moment." };

  await db.$transaction([
    db.inquiryMessage.create({ data: { inquiryId: inquiry.id, senderId: user.id, body: parsed.data.body } }),
    db.inquiry.update({
      where: { id: inquiry.id },
      data: { status: side === "SELLER" ? "RESPONDED" : inquiry.status, updatedAt: new Date() },
    }),
  ]);
  revalidatePath(`/inquiries/${inquiry.id}`);
  return { ok: true, message: "Message sent." };
}

export async function setInquiryStatusAction(inquiryId: string, status: "OPEN" | "CLOSED"): Promise<void> {
  const { inquiry, side } = await loadInquiryForUser(inquiryId);
  if (!inquiry || !side || side === "ADMIN") return;
  const next = status === "CLOSED" ? "CLOSED" : inquiry.messages.some((m) => m.sender.id === inquiry.seller.userId) ? "RESPONDED" : "OPEN";
  await db.inquiry.update({ where: { id: inquiry.id }, data: { status: next } });
  revalidatePath(`/inquiries/${inquiry.id}`);
  revalidatePath(side === "SELLER" ? "/seller/inquiries" : "/buyer/inquiries");
}

export async function reportListingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const raw = formToObject(formData);
  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);

  const limit = rateLimit(`report:${user.id}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) return { ok: false, message: "You've filed several reports recently. Please try again later." };

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, seller: { select: { userId: true } } },
  });
  if (!product) return { ok: false, message: "This listing no longer exists." };
  if (product.seller.userId === user.id) return { ok: false, message: "You can't report your own listing." };

  await db.report.create({
    data: {
      reporterId: user.id,
      productId: product.id,
      reportedUserId: product.seller.userId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });
  revalidatePath("/admin/reports");
  return { ok: true, message: "Thanks — our team will review this listing." };
}
