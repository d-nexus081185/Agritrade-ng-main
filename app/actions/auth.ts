"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth/session";
import {
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_COOKIE_PATH,
  OAUTH_LABELS,
  OAUTH_SIGNUP_COOKIE,
  isProviderConfigured,
  parseProvider,
  providerEnvNames,
  type OAuthProvider,
} from "@/lib/auth/oauth";
import { burnPasswordCheck, generateToken, hashPassword, hashToken, verifyPassword } from "@/lib/auth/tokens";
import { dashboardPathFor, safeRedirectPath } from "@/lib/access";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { RESET_TOKEN_TTL_MINUTES } from "@/lib/constants";
import { uniqueSlug } from "@/lib/slug";
import {
  echoValues,
  fieldError,
  fieldErrorsOf,
  forgotPasswordSchema,
  formToObject,
  loginSchema,
  parseRegistration,
  parseSocialRegistration,
  resetPasswordSchema,
  type ActionState,
} from "@/lib/validation";

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

function tooMany(ms: number): ActionState {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  return { ok: false, message: `Too many attempts. Please wait ${mins} minute${mins > 1 ? "s" : ""} and try again.` };
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limit = rateLimit(`register:${await clientIp()}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) return tooMany(limit.retryAfterMs);

  const raw = formToObject(formData);
  const provider = parseProvider(formData.get("provider"));
  if (provider) return startSocialSignup(provider, raw);

  const parsed = parseRegistration(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors, values: echoValues(raw) };
  }
  const v = parsed.data;

  if (await db.user.findUnique({ where: { email: v.email }, select: { id: true } })) {
    return fieldError("email", "An account with this email already exists. Try signing in instead.", raw);
  }

  const passwordHash = await hashPassword(v.password);
  const user = await db.user.create({
    data: {
      email: v.email,
      name: v.name,
      phone: v.phone,
      passwordHash,
      role: v.role,
      // Sellers can sign in and prepare listings straight away, but nothing is public until an admin approves them.
      status: v.role === "SELLER" ? "PENDING" : "ACTIVE",
      companyName: v.role === "BUYER" ? v.businessName : undefined,
      city: v.city,
      state: v.state || undefined,
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

  await createSession(user.id);
  redirect(`${dashboardPathFor(user.role)}?welcome=1`);
}

/** "Continue with Google/Facebook" on the sign-up form: remember the role details, then go to the provider. */
async function startSocialSignup(provider: OAuthProvider, raw: Record<string, unknown>): Promise<ActionState> {
  if (!isProviderConfigured(provider)) {
    const env = providerEnvNames(provider);
    return {
      ok: false,
      message:
        process.env.NODE_ENV === "production"
          ? `${OAUTH_LABELS[provider]} sign-up isn't available right now. Please use your email instead.`
          : `${OAUTH_LABELS[provider]} sign-up isn't configured. Set ${env.id} and ${env.secret} in .env.`,
      values: echoValues(raw),
    };
  }
  const parsed = parseSocialRegistration(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors, values: echoValues(raw) };
  }
  (await cookies()).set(OAUTH_SIGNUP_COOKIE, JSON.stringify(parsed.data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: OAUTH_COOKIE_PATH,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });
  redirect(`${OAUTH_COOKIE_PATH}/${provider}?intent=register`);
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  const { email, password } = parsed.data;

  const key = `login:${await clientIp()}:${email}`;
  const limit = rateLimit(key, 8, 15 * 60 * 1000);
  if (!limit.allowed) return tooMany(limit.retryAfterMs);

  const mismatch: ActionState = { ok: false, message: "That email and password don't match an account.", values: echoValues(raw) };
  const user = await db.user.findUnique({ where: { email } });
  // Accounts created through Google/Facebook have no password until the user sets one.
  if (!user?.passwordHash) {
    await burnPasswordCheck(password);
    return mismatch;
  }
  if (!(await verifyPassword(password, user.passwordHash))) return mismatch;
  if (user.status === "SUSPENDED") {
    return { ok: false, message: "This account has been suspended. Please contact AgriTrade support.", values: echoValues(raw) };
  }

  resetRateLimit(key);
  await createSession(user.id);
  redirect(safeRedirectPath(formData.get("next"), user.role));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/?mode=login&signedOut=1");
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);

  const limit = rateLimit(`forgot:${await clientIp()}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) return tooMany(limit.retryAfterMs);

  const generic: ActionState = {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way. The link expires in 30 minutes.",
  };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.status === "SUSPENDED") return generic;

  const token = generateToken();
  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
      },
    }),
  ]);

  const base = process.env.APP_URL || "http://localhost:3000";
  const link = `${base.replace(/\/$/, "")}/reset-password?token=${token}`;

  // NOTE: No email provider is connected yet. Plug one in here (e.g. Resend, SES, Postmark).
  if (process.env.NODE_ENV !== "production") {
    console.info(`[AgriTrade] Password reset link for ${user.email}: ${link}`);
    return { ...generic, devLink: link };
  }
  console.warn("[AgriTrade] Password reset requested but no email provider is configured.");
  return generic;
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);

  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, message: "This reset link is invalid or has expired. Request a new one." };
  }

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Sign out every existing session after a password change.
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  redirect("/?mode=login&reset=1");
}
