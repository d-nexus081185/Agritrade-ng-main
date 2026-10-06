// Sign-in with Google and Facebook (OAuth 2.0 authorization-code flow), without extra dependencies.
//
// Flow: /api/auth/oauth/{provider} stores a random `state` (+ PKCE verifier for Google) in a short-lived
// httpOnly cookie and redirects to the provider; the provider redirects back to
// /api/auth/oauth/{provider}/callback, which checks `state`, exchanges the code and reads the profile.
import { createHash, createHmac } from "node:crypto";

export const OAUTH_PROVIDERS = ["google", "facebook"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const OAUTH_LABELS: Record<OAuthProvider, string> = { google: "Google", facebook: "Facebook" };

/** Holds state/verifier/intent between the redirect to the provider and the callback. */
export const OAUTH_STATE_COOKIE = "agritrade_oauth";
/** Holds the role and seller details chosen on the sign-up form while the user is at the provider. */
export const OAUTH_SIGNUP_COOKIE = "agritrade_oauth_signup";
export const OAUTH_COOKIE_PATH = "/api/auth/oauth";
export const OAUTH_COOKIE_MAX_AGE = 10 * 60;

export type OAuthIntent = "login" | "register";
export type OAuthState = { provider: OAuthProvider; state: string; verifier: string; intent: OAuthIntent; next?: string };
export type OAuthProfile = { id: string; email?: string; emailVerified: boolean; name?: string };

const ENV: Record<OAuthProvider, { id: string; secret: string }> = {
  google: { id: "GOOGLE_CLIENT_ID", secret: "GOOGLE_CLIENT_SECRET" },
  facebook: { id: "FACEBOOK_APP_ID", secret: "FACEBOOK_APP_SECRET" },
};

export function parseProvider(value: unknown): OAuthProvider | undefined {
  return (OAUTH_PROVIDERS as readonly unknown[]).includes(value) ? (value as OAuthProvider) : undefined;
}

export function providerEnvNames(provider: OAuthProvider) {
  return ENV[provider];
}

function credentials(provider: OAuthProvider) {
  const id = process.env[ENV[provider].id];
  const secret = process.env[ENV[provider].secret];
  return id && secret ? { id, secret } : null;
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  return credentials(provider) !== null;
}

/**
 * Providers whose buttons appear on the sign-in page. Facebook is intentionally hidden from the
 * homepage sign-in flow, even if it is configured internally.
 */
export function visibleProviders(): OAuthProvider[] {
  const providers = process.env.NODE_ENV !== "production"
    ? [...OAUTH_PROVIDERS]
    : OAUTH_PROVIDERS.filter(isProviderConfigured);

  return providers.filter((provider) => provider !== "facebook");
}

export function redirectUri(provider: OAuthProvider): string {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${OAUTH_COOKIE_PATH}/${provider}/callback`;
}

function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function authorizationUrl(provider: OAuthProvider, state: string, verifier: string): string {
  const creds = credentials(provider);
  if (!creds) throw new Error(`${provider} sign-in is not configured`);
  if (provider === "google") {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: creds.id,
      redirect_uri: redirectUri(provider),
      response_type: "code",
      scope: "openid email profile",
      state,
      code_challenge: pkceChallenge(verifier),
      code_challenge_method: "S256",
      prompt: "select_account",
    }).toString();
    return url.toString();
  }
  // Unversioned endpoints use the app's default Graph API version set in the Meta dashboard.
  const url = new URL("https://www.facebook.com/dialog/oauth");
  url.search = new URLSearchParams({
    client_id: creds.id,
    redirect_uri: redirectUri(provider),
    response_type: "code",
    scope: "email,public_profile",
    state,
  }).toString();
  return url.toString();
}

async function getJson(res: Response, what: string) {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body) throw new Error(`${what} failed (${res.status}): ${JSON.stringify(body)}`);
  return body as Record<string, unknown>;
}

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

/** Exchanges the authorization code and returns the user's provider profile. */
export async function fetchProfile(provider: OAuthProvider, code: string, verifier: string): Promise<OAuthProfile> {
  const creds = credentials(provider);
  if (!creds) throw new Error(`${provider} sign-in is not configured`);

  if (provider === "google") {
    const token = await getJson(
      await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: creds.id,
          client_secret: creds.secret,
          redirect_uri: redirectUri(provider),
          grant_type: "authorization_code",
          code_verifier: verifier,
        }),
        cache: "no-store",
      }),
      "Google token exchange",
    );
    const info = await getJson(
      await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${str(token.access_token)}` },
        cache: "no-store",
      }),
      "Google userinfo",
    );
    const id = str(info.sub);
    if (!id) throw new Error("Google profile has no id");
    return { id, email: str(info.email)?.toLowerCase(), emailVerified: info.email_verified === true, name: str(info.name) };
  }

  const tokenUrl = new URL("https://graph.facebook.com/oauth/access_token");
  tokenUrl.search = new URLSearchParams({
    client_id: creds.id,
    client_secret: creds.secret,
    redirect_uri: redirectUri(provider),
    code,
  }).toString();
  const token = await getJson(await fetch(tokenUrl, { cache: "no-store" }), "Facebook token exchange");
  const accessToken = str(token.access_token) ?? "";
  const meUrl = new URL("https://graph.facebook.com/me");
  meUrl.search = new URLSearchParams({
    fields: "id,name,email",
    access_token: accessToken,
    appsecret_proof: createHmac("sha256", creds.secret).update(accessToken).digest("hex"),
  }).toString();
  const me = await getJson(await fetch(meUrl, { cache: "no-store" }), "Facebook profile");
  const id = str(me.id);
  if (!id) throw new Error("Facebook profile has no id");
  // Facebook only returns an email address once the user has confirmed it.
  const email = str(me.email)?.toLowerCase();
  return { id, email, emailVerified: Boolean(email), name: str(me.name) };
}
