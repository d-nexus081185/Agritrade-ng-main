import Link from "next/link";
import { Sprout } from "./Sprout";
import { titleCase } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="empty">
      <Sprout className="sprout-art" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <Link href={action.href} className="btn">{action.label}</Link>}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "",
  IN_STOCK: "",
  RESPONDED: "",
  RESOLVED: "",
  PENDING: "badge-warn",
  LIMITED: "badge-warn",
  OPEN: "badge-info",
  PRE_ORDER: "badge-info",
  CLOSED: "badge-neutral",
  DISMISSED: "badge-neutral",
  OUT_OF_STOCK: "badge-neutral",
  SUSPENDED: "badge-danger",
  REJECTED: "badge-danger",
  AWAITING_PAYMENT: "badge-warn",
  IN_ESCROW: "badge-info",
  SHIPPED: "badge-info",
  COMPLETED: "",
  DISPUTED: "badge-danger",
  REFUNDED: "badge-neutral",
  CANCELLED: "badge-neutral",
};

const STATUS_LABEL: Record<string, string> = {
  ...ORDER_STATUS_LABELS,
  PENDING: "Pending review",
  ACTIVE: "Active",
  IN_STOCK: "In stock",
  LIMITED: "Limited stock",
  PRE_ORDER: "Pre-order",
  OUT_OF_STOCK: "Out of stock",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <span className={`badge ${STATUS_TONE[status] ?? "badge-neutral"}`}>{label ?? STATUS_LABEL[status] ?? titleCase(status)}</span>;
}

export function StatCard({ label, value, sub, i = 0, earth }: { label: string; value: React.ReactNode; sub?: string; i?: number; earth?: boolean }) {
  return (
    <div className={`stat ${earth ? "earth" : ""}`} style={{ ["--i" as string]: i }}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export function Notice({ tone = "success", children }: { tone?: "success" | "info" | "warn" | "error"; children: React.ReactNode }) {
  return (
    <div className={`alert alert-${tone}`} role={tone === "error" ? "alert" : "status"} style={{ marginBottom: 20 }}>
      <p>{children}</p>
    </div>
  );
}
