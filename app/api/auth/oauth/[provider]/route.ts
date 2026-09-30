import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { generateToken } from "@/lib/auth/tokens";
import {
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_COOKIE_PATH,
  OAUTH_STATE_COOKIE,
  authorizationUrl,
  isProviderConfigured,
  parseProvider,
  type OAuthState,
} from "@/lib/auth/oauth";

// Starts "Continue with Google/Facebook": remembers a random state, then sends the user to the provider.
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const provider = parseProvider((await params).provider);
  const intent = req.nextUrl.searchParams.get("intent") === "register" ? "register" : "login";
  if (!provider) redirect(`/?mode=${intent}`);
  if (!isProviderConfigured(provider)) redirect(`/?mode=${intent}&oauthError=unconfigured&provider=${provider}`);

  const saved: OAuthState = {
    provider,
    state: generateToken(),
    verifier: generateToken(),
    intent,
    next: req.nextUrl.searchParams.get("next") ?? undefined,
  };
  (await cookies()).set(OAUTH_STATE_COOKIE, JSON.stringify(saved), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: OAUTH_COOKIE_PATH,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });
  redirect(authorizationUrl(provider, saved.state, saved.verifier));
}
