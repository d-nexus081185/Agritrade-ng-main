import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_DAYS, type Role } from "@/lib/constants";
import { dashboardPathFor } from "@/lib/access";
import { generateToken, hashToken } from "./tokens";

export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. Memoised per request. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { sellerProfile: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  // Suspended accounts lose access immediately, even with a live session.
  if (session.user.status === "SUSPENDED") return null;
  const { passwordHash: _omit, ...user } = session.user;
  void _omit;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Server-side guard for pages and actions: redirects to sign-in when there is no session. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/?mode=login");
  return user;
}

/** Server-side guard: the user must have one of `roles`, otherwise they go to their own dashboard. */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!(roles as string[]).includes(user.role)) redirect(dashboardPathFor(user.role));
  return user;
}

/** Seller guard that also returns the seller profile (every seller account has one). */
export async function requireSeller() {
  const user = await requireRole("SELLER");
  if (!user.sellerProfile) redirect("/account?setup=seller");
  return { user, profile: user.sellerProfile };
}
