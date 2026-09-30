import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForms } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { dashboardPathFor } from "@/lib/access";
import { db } from "@/lib/db";
import { publicListingWhere } from "@/lib/queries";
import { OAUTH_LABELS, parseProvider, providerEnvNames, visibleProviders, type OAuthProvider } from "@/lib/auth/oauth";

export const metadata = { title: "Sign in or create an account" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function AuthPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(dashboardPathFor(user.role));

  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const mode = one("mode") === "register" ? "register" : "login";
  const role = one("role") === "seller" ? "SELLER" : "BUYER";
  const provider = parseProvider(one("provider"));
  const oauthError = one("oauthError");
  const notice = provider && oauthError
    ? { tone: "error" as const, text: oauthErrorText(oauthError, provider) }
    : provider && one("oauthNoAccount")
    ? {
        tone: "info" as const,
        text: `There's no AgriTrade account for that ${OAUTH_LABELS[provider]} email yet. Choose how you'll use AgriTrade below, then continue with ${OAUTH_LABELS[provider]} to create one.`,
      }
    : one("reset")
    ? { tone: "success" as const, text: "Your password has been updated. Sign in with your new password." }
    : one("signedOut")
      ? { tone: "info" as const, text: "You've been signed out. See you soon." }
      : one("next")
        ? { tone: "info" as const, text: "Please sign in to continue." }
        : undefined;

  const [listings, sellers, states] = await Promise.all([
    db.product.count({ where: publicListingWhere }),
    db.user.count({ where: { role: "SELLER", status: "ACTIVE" } }),
    db.product.findMany({ where: publicListingWhere, distinct: ["state"], select: { state: true } }),
  ]).catch(() => [0, 0, [] as { state: string }[]] as const);

  return (
    <AuthShell stats={{ listings, sellers, states: states.length }}>
      <AuthForms initialMode={mode} initialRole={role} next={one("next")} notice={notice} providers={visibleProviders()} />
    </AuthShell>
  );
}

function oauthErrorText(code: string, provider: OAuthProvider): string {
  const label = OAUTH_LABELS[provider];
  switch (code) {
    case "cancelled":
      return `${label} sign-in was cancelled. You can try again or use your email instead.`;
    case "expired":
      return `Your ${label} sign-in took too long or was interrupted. Please try again.`;
    case "noemail":
      return `Your ${label} account didn't share an email address, which AgriTrade needs. Please use another sign-in method.`;
    case "unverified":
      return `Your ${label} email address isn't verified yet. Verify it with ${label}, or sign in with your email instead.`;
    case "suspended":
      return "This account has been suspended. Please contact AgriTrade support.";
    case "ratelimited":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "unconfigured": {
      if (process.env.NODE_ENV === "production") return `${label} sign-in isn't available right now. Please use your email instead.`;
      const env = providerEnvNames(provider);
      return `${label} sign-in isn't configured. Set ${env.id} and ${env.secret} in .env.`;
    }
    default:
      return `We couldn't sign you in with ${label}. Please try again.`;
  }
}
