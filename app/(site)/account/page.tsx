import { PageHead } from "@/components/layout/DashboardShell";
import { AccountForm, ChangePasswordForm } from "@/components/dashboard/AccountForms";
import { StatusBadge } from "@/components/ui/States";
import { requireUser } from "@/lib/auth/session";
import { formatDate, titleCase } from "@/lib/format";
import { db } from "@/lib/db";

export const metadata = { title: "Account settings" };

export default async function AccountPage() {
  const user = await requireUser();
  const account = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true, oauthAccounts: { select: { provider: true } } },
  });
  const hasPassword = Boolean(account.passwordHash);
  const linked = account.oauthAccounts.map((a) => titleCase(a.provider)).join(" and ");
  return (
    <>
      <PageHead
        eyebrow={`${titleCase(user.role)} account`}
        title="Account settings"
        description={`${user.email} · member since ${formatDate(user.createdAt)}`}
        actions={<StatusBadge status={user.status} label={user.status === "PENDING" ? "Awaiting approval" : undefined} />}
      />
      <div className="two-col">
        <section className="card card-pad" aria-labelledby="details-h">
          <h2 id="details-h" style={{ fontSize: "1.2rem" }}>Your details</h2>
          <AccountForm
            role={user.role}
            initial={{ name: user.name, phone: user.phone ?? "", companyName: user.companyName ?? "", city: user.city ?? "", state: user.state ?? "" }}
          />
        </section>
        <section className="card card-pad" aria-labelledby="pw-h">
          <h2 id="pw-h" style={{ fontSize: "1.2rem" }}>{hasPassword ? "Change password" : "Set a password"}</h2>
          {linked && (
            <p className="small muted">
              {hasPassword
                ? `You can also sign in with ${linked}.`
                : `You sign in with ${linked}. Set a password to also sign in with your email address.`}
            </p>
          )}
          <ChangePasswordForm hasPassword={hasPassword} />
        </section>
      </div>
    </>
  );
}
