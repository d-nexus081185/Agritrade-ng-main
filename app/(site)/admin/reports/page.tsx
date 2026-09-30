import Link from "next/link";
import { resolveReportAction, setListingStatusAction } from "@/app/actions/admin";
import { PageHead } from "@/components/layout/DashboardShell";
import { StatusTabs } from "@/components/dashboard/StatusTabs";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState, StatusBadge } from "@/components/ui/States";
import { requireRole } from "@/lib/auth/session";
import { REPORT_REASON_LABELS, REPORT_STATUSES, type ReportReason } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Reported content" };

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireRole("ADMIN");
  const { status } = await searchParams;
  const filter = REPORT_STATUSES.find((s) => s === status);

  const reports = await db.report.findMany({
    where: { status: filter },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      reporter: { select: { name: true, email: true } },
      product: { select: { id: true, title: true, slug: true, status: true } },
      reportedUser: { select: { name: true } },
    },
  });

  return (
    <>
      <PageHead eyebrow="Admin" title="Reported content" description="Reports filed by users against listings. Resolve once you've acted, or dismiss." />
      <StatusTabs base="/admin/reports" active={filter} statuses={REPORT_STATUSES} />
      {reports.length === 0 ? (
        <EmptyState title="No reports here">Nothing needs your attention in this view.</EmptyState>
      ) : (
        <ul className="stack" style={{ listStyle: "none", padding: 0, ["--stack" as string]: "14px" }}>
          {reports.map((r) => (
            <li key={r.id} className="card card-pad grow-in">
              <div className="row-between">
                <div>
                  <strong>{REPORT_REASON_LABELS[r.reason as ReportReason] ?? r.reason}</strong>
                  <div className="small muted">
                    Reported by {r.reporter.name} ({r.reporter.email}) · {formatDateTime(r.createdAt)}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.details && <p className="prose" style={{ margin: "12px 0" }}>“{r.details}”</p>}
              <p className="small" style={{ margin: "8px 0 14px" }}>
                Listing:{" "}
                {r.product ? (
                  <>
                    <Link href={`/products/${r.product.slug}`}>{r.product.title}</Link> <StatusBadge status={r.product.status} />
                  </>
                ) : (
                  <span className="muted">deleted</span>
                )}
                {r.reportedUser && <> · Seller: {r.reportedUser.name}</>}
              </p>
              <div className="row">
                {r.product && r.product.status === "ACTIVE" && (
                  <form action={setListingStatusAction.bind(null, r.product.id, "SUSPENDED")}>
                    <ConfirmButton message="Suspend this listing?" className="btn btn-danger-outline btn-sm">Suspend listing</ConfirmButton>
                  </form>
                )}
                {r.status === "OPEN" ? (
                  <>
                    <form action={resolveReportAction.bind(null, r.id, "RESOLVED")}>
                      <button type="submit" className="btn btn-sm">Mark resolved</button>
                    </form>
                    <form action={resolveReportAction.bind(null, r.id, "DISMISSED")}>
                      <button type="submit" className="btn btn-secondary btn-sm">Dismiss</button>
                    </form>
                  </>
                ) : (
                  <form action={resolveReportAction.bind(null, r.id, "OPEN")}>
                    <button type="submit" className="btn btn-ghost btn-sm">Reopen</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
