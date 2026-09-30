"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { LISTING_STATUSES, USER_STATUSES, type ListingStatus, type UserStatus } from "@/lib/constants";
import { moneyOwedWhere } from "@/lib/queries";
import { slugify } from "@/lib/format";
import { deleteUploadedImage } from "@/lib/uploads";
import { categorySchema, fieldError, fieldErrorsOf, formToObject, type ActionState } from "@/lib/validation";

function refreshAll() {
  revalidatePath("/admin", "layout");
  revalidatePath("/products");
  revalidatePath("/marketplace");
}

export async function setUserStatusAction(userId: string, status: string): Promise<void> {
  const admin = await requireRole("ADMIN");
  if (!USER_STATUSES.includes(status as UserStatus) || userId === admin.id) return;
  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target || target.role === "ADMIN") return; // admins are managed outside the UI
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { status } }),
    // A suspension signs the user out everywhere.
    ...(status === "SUSPENDED" ? [db.session.deleteMany({ where: { userId } })] : []),
  ]);
  refreshAll();
}

export async function deleteUserAction(userId: string): Promise<void> {
  const admin = await requireRole("ADMIN");
  if (userId === admin.id) return;
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, sellerProfile: { select: { products: { select: { images: { select: { url: true } } } } } } },
  });
  if (!target || target.role === "ADMIN") return;
  // Deleting would cascade to orders; never lose track of money AgriTrade is holding or owes.
  if (await db.order.count({ where: moneyOwedWhere(userId) })) return;
  await db.user.delete({ where: { id: userId } });
  const urls = target.sellerProfile?.products.flatMap((p) => p.images.map((i) => i.url)) ?? [];
  await Promise.all(urls.map(deleteUploadedImage));
  refreshAll();
}

export async function setListingStatusAction(listingId: string, status: string): Promise<void> {
  await requireRole("ADMIN");
  if (!LISTING_STATUSES.includes(status as ListingStatus)) return;
  const p = await db.product.update({ where: { id: listingId }, data: { status }, select: { slug: true } }).catch(() => null);
  if (p) revalidatePath(`/products/${p.slug}`);
  refreshAll();
}

export async function deleteListingAsAdminAction(listingId: string): Promise<void> {
  await requireRole("ADMIN");
  const listing = await db.product.findUnique({ where: { id: listingId }, include: { images: true } });
  if (!listing) return;
  await db.product.delete({ where: { id: listingId } });
  await Promise.all(listing.images.map((i) => deleteUploadedImage(i.url)));
  refreshAll();
}

export async function saveCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const raw = formToObject(formData);
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  const v = parsed.data;
  const id = formData.get("categoryId");
  const slug = slugify(v.name);
  const clash = await db.category.findFirst({
    where: { OR: [{ name: v.name }, { slug }], NOT: typeof id === "string" && id ? { id } : undefined },
  });
  if (clash) return fieldError("name", "A category with this name already exists.", raw);

  const data = { name: v.name, slug, description: v.description, imageUrl: v.imageUrl ?? null, sortOrder: v.sortOrder };
  if (typeof id === "string" && id) {
    await db.category.update({ where: { id }, data });
  } else {
    await db.category.create({ data });
  }
  refreshAll();
  return { ok: true, message: id ? "Category updated." : "Category added." };
}

export async function deleteCategoryAction(categoryId: string): Promise<{ error?: string }> {
  await requireRole("ADMIN");
  const count = await db.product.count({ where: { categoryId } });
  if (count > 0) return { error: `Move or remove its ${count} listing${count > 1 ? "s" : ""} first.` };
  await db.category.delete({ where: { id: categoryId } }).catch(() => undefined);
  refreshAll();
  return {};
}

export async function resolveReportAction(reportId: string, status: string): Promise<void> {
  await requireRole("ADMIN");
  if (!["OPEN", "RESOLVED", "DISMISSED"].includes(status)) return;
  await db.report.update({
    where: { id: reportId },
    data: { status, resolvedAt: status === "OPEN" ? null : new Date() },
  });
  refreshAll();
}
