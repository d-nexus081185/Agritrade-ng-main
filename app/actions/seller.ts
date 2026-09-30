"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth/session";
import { AVAILABILITY, type Availability } from "@/lib/constants";
import { uniqueSlug } from "@/lib/slug";
import { deleteUploadedImage, MAX_IMAGES_PER_LISTING, saveListingImages } from "@/lib/uploads";
import {
  fieldError,
  fieldErrorsOf,
  formToObject,
  listingSchema,
  sellerProfileSchema,
  type ActionState,
} from "@/lib/validation";

function revalidateListing(slug?: string) {
  revalidatePath("/seller");
  revalidatePath("/seller/listings");
  revalidatePath("/products");
  revalidatePath("/marketplace");
  if (slug) revalidatePath(`/products/${slug}`);
}

/** Creates a listing, or updates one the signed-in seller owns (when `listingId` is posted). */
export async function saveListingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireSeller();
  const raw = formToObject(formData, ["deliveryOptions"]);
  const parsed = listingSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  const v = parsed.data;

  if (!(await db.category.findUnique({ where: { id: v.categoryId }, select: { id: true } }))) {
    return fieldError("categoryId", "Choose a category.", raw);
  }

  const listingId = formData.get("listingId");
  const existing =
    typeof listingId === "string" && listingId
      ? await db.product.findFirst({ where: { id: listingId, sellerId: profile.id }, include: { images: true } })
      : null;
  if (listingId && !existing) return { ok: false, message: "Listing not found." };

  const removeIds = formData.getAll("removeImage").filter((x): x is string => typeof x === "string");
  const keptCount = (existing?.images.length ?? 0) - (existing?.images.filter((i) => removeIds.includes(i.id)).length ?? 0);
  const files = formData.getAll("photos").filter((f): f is File => typeof f === "object" && f !== null && "size" in f && f.size > 0);
  if (keptCount + files.length > MAX_IMAGES_PER_LISTING) {
    return fieldError("photos", `A listing can have at most ${MAX_IMAGES_PER_LISTING} photos — remove one first.`, raw);
  }
  const upload = await saveListingImages(files);
  if (upload.error) return fieldError("photos", upload.error, raw);

  const data = {
    title: v.title,
    categoryId: v.categoryId,
    description: v.description,
    unit: v.unit,
    price: v.price,
    quantityAvailable: v.quantityAvailable,
    minOrderQty: v.minOrderQty,
    availability: v.availability,
    city: v.city,
    state: v.state,
    deliveryOptions: v.deliveryOptions.join(","),
  };

  let slug: string;
  if (existing) {
    const toRemove = existing.images.filter((i) => removeIds.includes(i.id));
    await db.$transaction([
      db.productImage.deleteMany({ where: { id: { in: toRemove.map((i) => i.id) }, productId: existing.id } }),
      db.product.update({
        where: { id: existing.id },
        data: {
          ...data,
          // Rejected listings go back into the review queue once edited.
          status: existing.status === "REJECTED" ? "PENDING" : existing.status,
          images: {
            create: upload.saved.map((s, i) => ({ url: s.url, alt: v.title, sortOrder: keptCount + i })),
          },
        },
      }),
    ]);
    await Promise.all(toRemove.map((i) => deleteUploadedImage(i.url)));
    slug = existing.slug;
  } else {
    slug = await uniqueSlug(v.title, async (s) => Boolean(await db.product.findUnique({ where: { slug: s }, select: { id: true } })));
    await db.product.create({
      data: {
        ...data,
        slug,
        sellerId: profile.id,
        status: "PENDING",
        images: { create: upload.saved.map((s, i) => ({ url: s.url, alt: v.title, sortOrder: i })) },
      },
    });
  }

  revalidateListing(slug);
  redirect(`/seller/listings?saved=${existing ? "updated" : "created"}`);
}

export async function setAvailabilityAction(listingId: string, formData: FormData): Promise<void> {
  const { profile } = await requireSeller();
  const availability = formData.get("availability");
  if (!AVAILABILITY.includes(availability as Availability)) return;
  const res = await db.product.updateMany({
    where: { id: listingId, sellerId: profile.id },
    data: { availability: availability as Availability },
  });
  if (res.count) revalidateListing();
}

export async function deleteListingAction(listingId: string): Promise<void> {
  const { profile } = await requireSeller();
  const listing = await db.product.findFirst({ where: { id: listingId, sellerId: profile.id }, include: { images: true } });
  if (!listing) return;
  await db.product.delete({ where: { id: listing.id } });
  await Promise.all(listing.images.map((i) => deleteUploadedImage(i.url)));
  revalidateListing(listing.slug);
  redirect("/seller/listings?saved=deleted");
}

export async function updateSellerProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireSeller();
  const raw = formToObject(formData, ["deliveryOptions"]);
  const parsed = sellerProfileSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  const v = parsed.data;
  await db.sellerProfile.update({
    where: { id: profile.id },
    data: {
      businessName: v.businessName,
      description: v.description,
      city: v.city,
      state: v.state,
      phone: v.phone ?? null,
      deliveryOptions: v.deliveryOptions.join(","),
      yearsInBusiness: v.yearsInBusiness ?? null,
    },
  });
  revalidatePath("/seller/profile");
  revalidatePath(`/sellers/${profile.slug}`);
  return { ok: true, message: "Seller profile saved." };
}
