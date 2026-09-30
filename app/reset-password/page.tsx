import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/PasswordResetForms";
import { Icon } from "@/components/ui/Icon";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const record =
    typeof token === "string" && token.length >= 20
      ? await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } })
      : null;
  const valid = record && !record.usedAt && record.expiresAt > new Date();

  return (
    <AuthShell>
      {valid ? (
        <ResetPasswordForm token={token!} />
      ) : (
        <div>
          <h1 style={{ fontSize: "2rem" }}>This link has expired</h1>
          <div className="alert alert-error" role="alert" style={{ margin: "16px 0 24px" }}>
            <Icon name="alert" />
            <p>Password reset links work once and expire after 30 minutes. Request a new one below.</p>
          </div>
          <Link href="/forgot-password" className="btn btn-block">Request a new link</Link>
          <p className="small muted" style={{ marginTop: 16, textAlign: "center" }}>
            <Link href="/?mode=login">Back to sign in</Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
