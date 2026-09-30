import type { DashNavItem } from "@/components/layout/DashboardNav";
import type { CurrentUser } from "./auth/session";
import { db } from "./db";

/** Sidebar items per role, with live "needs attention" counts. */
export async function dashboardNavFor(user: CurrentUser): Promise<{ label: string; items: DashNavItem[] }> {
  if (user.role === "ADMIN") {
    const [pendingUsers, pendingListings, openReports, escrowTasks] = await Promise.all([
      db.user.count({ where: { status: "PENDING" } }),
      db.product.count({ where: { status: "PENDING" } }),
      db.report.count({ where: { status: "OPEN" } }),
      db.order.count({ where: { OR: [{ status: "DISPUTED" }, { status: "COMPLETED", payoutStatus: "PENDING" }] } }),
    ]);
    return {
      label: "Admin",
      items: [
        { href: "/admin", label: "Overview", icon: "grid", exact: true },
        { href: "/admin/users", label: "Users", icon: "users", count: pendingUsers },
        { href: "/admin/listings", label: "Listings", icon: "package", count: pendingListings },
        { href: "/admin/orders", label: "Orders & escrow", icon: "wallet", count: escrowTasks },
        { href: "/admin/categories", label: "Categories", icon: "layers" },
        { href: "/admin/reports?status=OPEN", label: "Reports", icon: "flag", count: openReports },
        { href: "/account", label: "Account", icon: "user" },
      ],
    };
  }
  if (user.role === "SELLER") {
    const [open, toShip] = user.sellerProfile
      ? await Promise.all([
          db.inquiry.count({ where: { sellerId: user.sellerProfile.id, status: "OPEN" } }),
          db.order.count({ where: { sellerId: user.sellerProfile.id, status: "IN_ESCROW" } }),
        ])
      : [0, 0];
    return {
      label: "Seller",
      items: [
        { href: "/seller", label: "Overview", icon: "grid", exact: true },
        { href: "/seller/listings", label: "Listings", icon: "package" },
        { href: "/seller/inquiries", label: "Inquiries", icon: "chat", count: open },
        { href: "/seller/orders", label: "Orders & payouts", icon: "wallet", count: toShip },
        { href: "/seller/profile", label: "Seller profile", icon: "store" },
        { href: "/account", label: "Account", icon: "user" },
      ],
    };
  }
  const toAct = await db.order.count({ where: { buyerId: user.id, status: { in: ["AWAITING_PAYMENT", "SHIPPED"] } } });
  return {
    label: "Buyer",
    items: [
      { href: "/buyer", label: "Overview", icon: "grid", exact: true },
      { href: "/buyer/inquiries", label: "My inquiries", icon: "chat" },
      { href: "/buyer/orders", label: "My orders", icon: "wallet", count: toAct },
      { href: "/buyer/saved", label: "Saved products", icon: "heart" },
      { href: "/products", label: "Browse products", icon: "search" },
      { href: "/account", label: "Account", icon: "user" },
    ],
  };
}
