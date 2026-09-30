import type { Prisma } from "@prisma/client";
import { db, insensitive } from "./db";
import { ESCROW_HELD_STATUSES, PAGE_SIZE } from "./constants";
import type { MarketplaceFilters } from "./validation";

/** Only approved listings from active sellers are ever visible to the public. */
export const publicListingWhere: Prisma.ProductWhereInput = {
  status: "ACTIVE",
  seller: { user: { status: "ACTIVE" } },
};

/** Orders involving this user where AgriTrade still holds money or owes the seller a payout. */
export function moneyOwedWhere(userId: string): Prisma.OrderWhereInput {
  return {
    AND: [
      { OR: [{ buyerId: userId }, { seller: { userId } }] },
      { OR: [{ status: { in: [...ESCROW_HELD_STATUSES] } }, { status: "COMPLETED", payoutStatus: "PENDING" }] },
    ],
  };
}

export const productCardInclude = {
  images: { orderBy: { sortOrder: "asc" }, take: 1 },
  category: { select: { name: true, slug: true } },
  seller: { select: { businessName: true, slug: true } },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export function buildMarketplaceWhere(f: MarketplaceFilters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [publicListingWhere];
  if (f.q) {
    and.push({
      OR: [
        { title: { contains: f.q, ...insensitive } },
        { description: { contains: f.q, ...insensitive } },
        { category: { name: { contains: f.q, ...insensitive } } },
        { seller: { businessName: { contains: f.q, ...insensitive } } },
      ],
    });
  }
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.state) and.push({ state: f.state });
  if (f.availability) and.push({ availability: f.availability });
  if (f.minPrice != null || f.maxPrice != null) {
    and.push({ price: { not: null, gte: f.minPrice ?? undefined, lte: f.maxPrice ?? undefined } });
  }
  return { AND: and };
}

export async function searchListings(f: MarketplaceFilters) {
  const where = buildMarketplaceWhere(f);
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    f.sort === "price-asc"
      ? [{ price: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }]
      : f.sort === "price-desc"
        ? [{ price: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];
  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      include: productCardInclude,
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { total, items, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function getCategories() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: publicListingWhere } } } },
  });
}

export async function getSavedIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await db.savedProduct.findMany({ where: { userId }, select: { productId: true } });
  return new Set(rows.map((r) => r.productId));
}
