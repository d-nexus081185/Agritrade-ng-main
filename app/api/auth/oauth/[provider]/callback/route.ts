import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import {
  OAUTH_COOKIE_PATH,
  OAUTH_SIGNUP_COOKIE,
  OAUTH_STATE_COOKIE,
  fetchProfile,
  parseProvider,
  type OAuthProfile,
  type OAuthProvider,
  type OAuthState,
} from "@/lib/auth/oauth";
import { dashboardPathFor, safeRedirectPath } from "@/lib/access";
import { rateLimit } from "@/lib/rate-limit";
import { uniqueSlug } from "@/lib/slug";
import { socialSignupSchema, type SocialSignup } from "@/lib/validation";

function readJson(value: string | undefined): unknown {
  try {
    return value ? JSON.parse(value) : undefined;
  } catch {
    return undefined;
  }
}

function sameToken(a: unknown, b: unknown) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// The provider sends the user back here with ?code&state (or ?error when they cancel).
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const provider = parseProvider((await params).provider);
  const jar = await cookies();
  const saved = readJson(jar.get(OAUTH_STATE_COOKIE)?.value) as OAuthState | undefined;
  const signupRaw = readJson(jar.get(OAUTH_SIGNUP_COOKIE)?.value);
  // One-shot cookies: clear them whatever happens next.
  for (const name of [OAUTH_STATE_COOKIE, OAUTH_SIGNUP_COOKIE]) jar.set(name, "", { path: OAUTH_COOKIE_PATH, maxAge: 0 });

  const intent = saved?.intent === "register" ? "register" : "login";
  const fail = (code: string): never => redirect(`/?mode=${intent}&oauthError=${code}${provider ? `&provider=${provider}` : ""}`);

  const sp = req.nextUrl.searchParams;
  if (!provider) return fail("failed");
  if (sp.get("error")) return fail("cancelled");
  const code = sp.get("code");
  if (!code || !saved || saved.provider !== provider || !sameToken(sp.get("state"), saved.state)) return fail("expired");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  if (!rateLimit(`oauth:${ip}`, 20, 15 * 60 * 1000).allowed) return fail("ratelimited");

  let profile: OAuthProfile;
  try {
    profile = await fetchProfile(provider, code, saved.verifier);
  } catch (err) {
    console.error(`[AgriTrade] ${provider} sign-in failed:`, err);
    return fail("failed");
  }

  const user = await findOrLinkUser(provider, profile);
  if (user === "unverified") return fail(profile.email ? "unverified" : "noemail");
  if (user) {
    if (user.status === "SUSPENDED") return fail("suspended");
    await createSession(user.id);
    redirect(safeRedirectPath(saved.next, user.role));
  }

  // No AgriTrade account yet. Only the sign-up form collects the role (and seller details) we need.
  const signup = socialSignupSchema.safeParse(signupRaw);
  if (intent !== "register" || !signup.success) redirect(`/?mode=register&oauthNoAccount=1&provider=${provider}`);

  const created = await createSocialUser(provider, profile as OAuthProfile & { email: string }, signup.data);
  await createSession(created.id);
  redirect(`${dashboardPathFor(created.role)}?welcome=1`);
}

/**
 * The user already linked to this provider identity, or else the user with the same (verified) email,
 * which is then linked. Returns null when there is no account, "unverified" when we can't trust the email.
 */
async function findOrLinkUser(provider: OAuthProvider, profile: OAuthProfile) {
  const key = { provider: provider.toUpperCase(), providerAccountId: profile.id };
  const linked = await db.oAuthAccount.findUnique({ where: { provider_providerAccountId: key }, include: { user: true } });
  if (linked) return linked.user;

  if (!profile.email || !profile.emailVerified) return "unverified" as const;
  const user = await db.user.findUnique({ where: { email: profile.email } });
  if (user) await db.oAuthAccount.create({ data: { ...key, userId: user.id } });
  return user;
}

async function createSocialUser(provider: OAuthProvider, profile: OAuthProfile & { email: string }, v: SocialSignup) {
  const name = profile.name?.trim().slice(0, 80) || profile.email.split("@")[0];
  return db.user.create({
    data: {
      email: profile.email,
      name,
      phone: v.phone,
      passwordHash: null,
      role: v.role,
      // Same rule as email sign-up: sellers wait for admin approval before anything is public.
      status: v.role === "SELLER" ? "PENDING" : "ACTIVE",
      companyName: v.role === "BUYER" ? v.businessName : undefined,
      city: v.city,
      state: v.state || undefined,
      oauthAccounts: { create: { provider: provider.toUpperCase(), providerAccountId: profile.id } },
      sellerProfile:
        v.role === "SELLER"
          ? {
              create: {
                businessName: v.businessName!,
                slug: await uniqueSlug(v.businessName!, async (slug) =>
                  Boolean(await db.sellerProfile.findUnique({ where: { slug }, select: { id: true } })),
                ),
                city: v.city!,
                state: v.state!,
                phone: v.phone,
              },
            }
          : undefined,
    },
  });
}
