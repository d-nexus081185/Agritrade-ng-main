export const ROLES = ["BUYER", "SELLER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "PENDING", "SUSPENDED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const LISTING_STATUSES = ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const AVAILABILITY = ["IN_STOCK", "LIMITED", "PRE_ORDER", "OUT_OF_STOCK"] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  IN_STOCK: "In stock",
  LIMITED: "Limited stock",
  PRE_ORDER: "Pre-order",
  OUT_OF_STOCK: "Out of stock",
};

export const DELIVERY_OPTIONS = ["DELIVERY", "PICKUP"] as const;
export type DeliveryOption = (typeof DELIVERY_OPTIONS)[number];

export const DELIVERY_LABELS: Record<DeliveryOption, string> = {
  DELIVERY: "Delivery",
  PICKUP: "Pickup",
};

export const INQUIRY_STATUSES = ["OPEN", "RESPONDED", "CLOSED"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const REPORT_REASONS = ["MISLEADING", "PROHIBITED", "FRAUD", "QUALITY", "OTHER"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  MISLEADING: "Misleading price or description",
  PROHIBITED: "Prohibited or unsafe product",
  FRAUD: "Suspected fraud or scam",
  QUALITY: "Quality complaint",
  OTHER: "Something else",
};

export const REPORT_STATUSES = ["OPEN", "RESOLVED", "DISMISSED"] as const;

/**
 * Escrow order lifecycle:
 * AWAITING_PAYMENT → IN_ESCROW (buyer paid; AgriTrade holds the money) → SHIPPED (optional) →
 * COMPLETED (buyer confirmed delivery; money released to the seller).
 * DISPUTED orders are settled by an admin (release to seller, or refund to buyer).
 */
export const ORDER_STATUSES = ["AWAITING_PAYMENT", "IN_ESCROW", "SHIPPED", "COMPLETED", "DISPUTED", "REFUNDED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  IN_ESCROW: "Paid · held in escrow",
  SHIPPED: "Dispatched",
  COMPLETED: "Completed",
  DISPUTED: "In dispute",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

/** Orders whose money AgriTrade is currently holding. */
export const ESCROW_HELD_STATUSES: readonly OrderStatus[] = ["IN_ESCROW", "SHIPPED", "DISPUTED"];

export const PAYOUT_STATUSES = ["NONE", "PENDING", "PAID"] as const;

/** AgriTrade's commission on released escrow payments, in percent (0 = no fee). */
export const PLATFORM_FEE_PERCENT = Math.min(50, Math.max(0, Number(process.env.PLATFORM_FEE_PERCENT ?? 0) || 0));

/** Upper bound for a single order total in Naira. */
export const MAX_ORDER_TOTAL = 500_000_000;

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
] as const;

export const SESSION_COOKIE = "agritrade_session";
export const SESSION_TTL_DAYS = 14;
export const RESET_TOKEN_TTL_MINUTES = 30;
export const PAGE_SIZE = 12;

/** Seller-uploaded photos are served from this route (see app/api/uploads). */
export const UPLOAD_URL_PREFIX = "/api/uploads/";

/** Home area for each role after sign-in. */
export const DASHBOARD_PATH: Record<Role, string> = {
  BUYER: "/buyer",
  SELLER: "/seller",
  ADMIN: "/admin",
};

/** Route prefixes and which roles may open them. Enforced in pages and server actions. */
export const PROTECTED_AREAS: { prefix: string; roles: readonly Role[] }[] = [
  { prefix: "/buyer", roles: ["BUYER"] },
  { prefix: "/seller", roles: ["SELLER"] },
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/account", roles: ROLES },
  { prefix: "/inquiries", roles: ROLES },
  { prefix: "/orders", roles: ROLES },
];
