import type { Role } from "@/lib/constants";
import { requireRole, requireUser } from "@/lib/auth/session";
import { dashboardNavFor } from "@/lib/nav";
import { DashboardShell } from "./DashboardShell";

/**
 * Layout wrapper for dashboard areas. Checks the role on the server; every page in these areas
 * repeats the check (layouts are not re-run on every client navigation).
 */
export async function RoleDashboard({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const user = roles ? await requireRole(...roles) : await requireUser();
  const nav = await dashboardNavFor(user);
  return <DashboardShell label={nav.label} items={nav.items}>{children}</DashboardShell>;
}
