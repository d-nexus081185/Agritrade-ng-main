// Pure helpers for role-based routing. Kept free of server-only imports so they can be unit tested
// and used from middleware.
import { DASHBOARD_PATH, PROTECTED_AREAS, type Role } from "./constants";

export function dashboardPathFor(role: string): string {
  return DASHBOARD_PATH[role as Role] ?? "/marketplace";
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_AREAS.some((a) => matchesPrefix(pathname, a.prefix));
}

export function canAccessPath(role: string, pathname: string): boolean {
  const area = PROTECTED_AREAS.find((a) => matchesPrefix(pathname, a.prefix));
  if (!area) return true;
  return (area.roles as readonly string[]).includes(role);
}

/**
 * Returns a safe post-login destination: only same-site relative paths the role may open,
 * otherwise the role's dashboard. Prevents open redirects like `?next=//evil.com`.
 */
export function safeRedirectPath(next: unknown, role: string): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return dashboardPathFor(role);
  }
  if (next === "/" || !canAccessPath(role, next)) return dashboardPathFor(role);
  return next;
}

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}
