import Link from "next/link";
import { PageHead } from "@/components/layout/DashboardShell";
import { StatCard, StatusBadge } from "@/components/ui/States";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, titleCase } from "@/lib/format";

export const metadata = { title: "Admin overview" };

export default async function AdminOverview() {
  await requireRole("ADMIN");
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [users, listings, inquiriesTotal, inquiriesWeek, openReports, newUsers, pendingListings, byCategory] = await Promise.all([
    db.user.groupBy({ by: ["role", "status"], _count: true }),
    db.product.groupBy({ by: ["status"], _count: true }),
    db.inquiry.count(),
    db.inquiry.count({ where: { createdAt: { gte: weekAgo } } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, email: true, role: true, status: true, createdAt: true } }),
    db.product.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 6, select: { id: true, title: true, slug: true, createdAt: true, seller: { select: { businessName: true } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, _count: { select: { products: { where: { status: "ACTIVE" } } } } } }),
  ]);
  const userCount = (role?: string, status?: string) =>
    users.filter((u) => (!role || u.role === role) && (!status || u.status === status)).reduce((n, u) => n + u._count, 0);
  const listingCount = (s?: string) => listings.filter((l) => !s || l.status === s).reduce((n, l) => n + l._count, 0);
  const maxCat = Math.max(1, ...byCategory.map((c) => c._count.products));

  return (
    <>
      <PageHead eyebrow="Admin" title="Platform overview" description="Live figures from the database." />
      <div className="stats">
        <StatCard i={0} label="Buyers" value={userCount("BUYER")} sub={`${userCount("BUYER", "SUSPENDED")} suspended`} />
        <StatCard i={1} label="Sellers" value={userCount("SELLER")} sub={`${userCount("SELLER", "PENDING")} awaiting approval`} earth />
        <StatCard i={2} label="Live listings" value={listingCount("ACTIVE")} sub={`${listingCount("PENDING")} pending review`} />
        <StatCard i={3} label="Inquiries" value={inquiriesTotal} sub={`${inquiriesWeek} in the last 7 days`} earth />
        <StatCard i={4} label="Open reports" value={openReports} />
      </div>

      <div className="two-col">
        <section className="card card-pad" aria-labelledby="queue-h">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <h2 id="queue-h" style={{ fontSize: "1.2rem", margin: 0 }}>Listings awaiting review</h2>
            <Link href="/admin/listings?status=PENDING" className="small">Review queue</Link>
          </div>
          {pendingListings.length ? (
            <ul className="list">
              {pendingListings.map((p) => (
                <li key={p.id} className="list-item">
                  <div className="grow">
                    <Link href={`/products/${p.slug}`} className="title">{p.title}</Link>
                    <div className="small muted">{p.seller.businessName} · submitted {formatDate(p.createdAt)}</div>
                  </div>
                  <StatusBadge status="PENDING" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">The review queue is empty. 🎉</p>
          )}

          <h2 style={{ fontSize: "1.2rem", marginTop: 28 }}>Live listings by category</h2>
          <ul className="list" aria-label="Live listings by category">
            {byCategory.map((c) => (
              <li key={c.name} style={{ display: "grid", gridTemplateColumns: "140px 1fr 32px", gap: 12, alignItems: "center", padding: "6px 0" }}>
                <span className="small">{c.name}</span>
                <span aria-hidden="true" style={{ height: 10, borderRadius: 5, background: "var(--green-100)", overflow: "hidden" }}>
                  <span className="grow-in" style={{ display: "block", height: "100%", width: `${(c._count.products / maxCat) * 100}%`, background: "var(--green-600)", borderRadius: 5 }} />
                </span>
                <strong className="small" style={{ textAlign: "right" }}>{c._count.products}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="card card-pad" aria-labelledby="signups-h">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <h2 id="signups-h" style={{ fontSize: "1.2rem", margin: 0 }}>Newest accounts</h2>
            <Link href="/admin/users" className="small">All users</Link>
          </div>
          <ul className="list">
            {newUsers.map((u) => (
              <li key={u.id} className="list-item">
                <div className="grow" style={{ minWidth: 0 }}>
                  <strong>{u.name}</strong>
                  <div className="small muted truncate">{u.email} · {titleCase(u.role)} · {formatDateTime(u.createdAt)}</div>
                </div>
                <StatusBadge status={u.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
