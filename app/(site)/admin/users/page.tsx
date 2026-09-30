import Link from "next/link";
import { deleteUserAction, setUserStatusAction } from "@/app/actions/admin";
import { PageHead } from "@/components/layout/DashboardShell";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState, StatusBadge } from "@/components/ui/States";
import { requireRole } from "@/lib/auth/session";
import { ESCROW_HELD_STATUSES, ROLES, USER_STATUSES } from "@/lib/constants";
import { db, insensitive } from "@/lib/db";
import { formatDate, titleCase } from "@/lib/format";

export const metadata = { title: "Manage users" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ role?: string; status?: string; q?: string }> }) {
  const admin = await requireRole("ADMIN");
  const sp = await searchParams;
  const role = ROLES.find((r) => r === sp.role);
  const status = USER_STATUSES.find((s) => s === sp.status);
  const q = sp.q?.trim().slice(0, 100);

  const [users, withMoneyOwed] = await Promise.all([db.user.findMany({
    where: {
      role,
      status,
      ...(q ? { OR: [{ name: { contains: q, ...insensitive } }, { email: { contains: q, ...insensitive } }, { sellerProfile: { businessName: { contains: q, ...insensitive } } }] } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      sellerProfile: { select: { businessName: true, slug: true, _count: { select: { products: true } } } },
      _count: { select: { inquiries: true, reportsAgainst: { where: { status: "OPEN" } } } },
    },
  }), db.order.findMany({
    where: { OR: [{ status: { in: [...ESCROW_HELD_STATUSES] } }, { status: "COMPLETED", payoutStatus: "PENDING" }] },
    select: { buyerId: true, seller: { select: { userId: true } } },
  })]);
  const blocked = new Set(withMoneyOwed.flatMap((o) => [o.buyerId, o.seller.userId]));

  return (
    <>
      <PageHead eyebrow="Admin" title="Users" description="Approve new sellers, suspend accounts that break the rules, or remove them." />
      <form method="get" className="card card-pad row" style={{ marginBottom: 20, alignItems: "flex-end" }}>
        <div className="field" style={{ flex: "2 1 220px" }}>
          <label className="label" htmlFor="uq">Search</label>
          <input id="uq" name="q" className="input" defaultValue={q} placeholder="Name, email or business" />
        </div>
        <div className="field" style={{ flex: "1 1 140px" }}>
          <label className="label" htmlFor="urole">Role</label>
          <select id="urole" name="role" className="select" defaultValue={role ?? ""}>
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: "1 1 140px" }}>
          <label className="label" htmlFor="ustatus">Status</label>
          <select id="ustatus" name="status" className="select" defaultValue={status ?? ""}>
            <option value="">Any status</option>
            {USER_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </div>
        <button className="btn" type="submit">Filter</button>
        <Link href="/admin/users" className="btn btn-ghost">Reset</Link>
      </form>

      {users.length === 0 ? (
        <EmptyState title="No users match these filters" />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <caption className="sr-only">User accounts</caption>
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Activity</th>
                <th scope="col">Joined</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === admin.id;
                const manageable = !self && u.role !== "ADMIN";
                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong> {u.isSample && <span className="badge badge-earth no-dot">Sample</span>}
                      <div className="small muted">{u.email}</div>
                      {u.sellerProfile && <Link href={`/sellers/${u.sellerProfile.slug}`} className="small">{u.sellerProfile.businessName}</Link>}
                    </td>
                    <td>{titleCase(u.role)}</td>
                    <td><StatusBadge status={u.status} /></td>
                    <td className="small muted">
                      {u.sellerProfile ? `${u.sellerProfile._count.products} listings` : `${u._count.inquiries} inquiries`}
                      {u._count.reportsAgainst > 0 && <div style={{ color: "var(--danger)" }}>{u._count.reportsAgainst} open report(s)</div>}
                    </td>
                    <td className="small">{formatDate(u.createdAt)}</td>
                    <td>
                      {manageable ? (
                        <div className="cell-actions">
                          {u.status !== "ACTIVE" && (
                            <form action={setUserStatusAction.bind(null, u.id, "ACTIVE")}>
                              <button className="btn btn-sm" type="submit">{u.status === "PENDING" ? "Approve" : "Reactivate"}</button>
                            </form>
                          )}
                          {u.status !== "SUSPENDED" && (
                            <form action={setUserStatusAction.bind(null, u.id, "SUSPENDED")}>
                              <ConfirmButton message={`Suspend ${u.name}? They will be signed out and their listings hidden.`} className="btn btn-secondary btn-sm">Suspend</ConfirmButton>
                            </form>
                          )}
                          {blocked.has(u.id) ? (
                            <span className="small muted" title="Settle their escrow orders and payouts first">Has money in escrow</span>
                          ) : (
                            <form action={deleteUserAction.bind(null, u.id)}>
                              <ConfirmButton message={`Permanently delete ${u.name} and all their data? This cannot be undone.`} className="btn btn-danger-outline btn-sm">Delete</ConfirmButton>
                            </form>
                          )}
                        </div>
                      ) : (
                        <span className="small muted">{self ? "You" : "Admin"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
