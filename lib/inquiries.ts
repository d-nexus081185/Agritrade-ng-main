import { db } from "./db";
import { requireUser } from "./auth/session";

/**
 * Loads an inquiry and works out how the current user relates to it.
 * Buyers and sellers see only their own conversations; admins get read-only access.
 */
export async function loadInquiryForUser(inquiryId: string) {
  const user = await requireUser();
  const inquiry = await db.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      seller: { select: { userId: true, businessName: true, slug: true, phone: true } },
      buyer: { select: { id: true, name: true, companyName: true, email: true, phone: true, city: true, state: true } },
      product: {
        select: { slug: true, unit: true, price: true, status: true, deliveryOptions: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
      },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, name: true, role: true } } } },
      orders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, reference: true, total: true, status: true, createdAt: true },
      },
    },
  });
  if (!inquiry) return { user, inquiry: null, side: null } as const;
  const side: "BUYER" | "SELLER" | "ADMIN" | null =
    inquiry.buyerId === user.id
      ? "BUYER"
      : inquiry.seller.userId === user.id
        ? "SELLER"
        : user.role === "ADMIN"
          ? "ADMIN"
          : null;
  if (!side) return { user, inquiry: null, side: null } as const;
  return { user, inquiry, side } as const;
}
