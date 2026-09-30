import Link from "next/link";
import { StatusBadge } from "@/components/ui/States";
import { formatDateTime, formatNumber, formatPrice } from "@/lib/format";

export type OrderRow = {
  id: string;
  reference: string;
  productTitle: string;
  quantity: number;
  unit: string;
  total: number;
  status: string;
  updatedAt: Date;
  counterpart: string;
};

export function OrderList({ rows }: { rows: OrderRow[] }) {
  return (
    <ul className="list">
      {rows.map((r, i) => (
        <li key={r.id} className="list-item grow-in" style={{ ["--i" as string]: Math.min(i, 8) }}>
          <div className="grow">
            <Link href={`/orders/${r.id}`} className="title">{r.productTitle}</Link>
            <div className="small muted truncate">
              {r.reference} · {r.counterpart} · {formatNumber(r.quantity)} × {r.unit}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <strong>{formatPrice(r.total)}</strong>
            <div style={{ marginTop: 4 }}><StatusBadge status={r.status} /></div>
            <div className="small muted" style={{ marginTop: 4 }}>{formatDateTime(r.updatedAt)}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const STEPS = [
  { key: "AWAITING_PAYMENT", label: "Payment requested" },
  { key: "IN_ESCROW", label: "Paid into escrow" },
  { key: "SHIPPED", label: "Dispatched" },
  { key: "COMPLETED", label: "Delivered · released" },
] as const;

/** Progress through the escrow steps. Off-path states (dispute, refund, cancel) show as a notice instead. */
export function EscrowSteps({ status, shipped }: { status: string; shipped: boolean }) {
  const reached = (key: string) => {
    const order = ["AWAITING_PAYMENT", "IN_ESCROW", "SHIPPED", "COMPLETED"];
    const at = order.indexOf(status);
    if (key === "SHIPPED" && status === "COMPLETED") return shipped;
    return at >= order.indexOf(key);
  };
  return (
    <ol className="escrow-steps" aria-label="Order progress">
      {STEPS.map((s) => {
        const done = reached(s.key);
        return (
          <li key={s.key} className={done ? "done" : ""} aria-current={status === s.key ? "step" : undefined}>
            <span className="dot" aria-hidden="true" />
            <span>{s.label}</span>
            <span className="sr-only">{done ? " (done)" : " (not yet)"}</span>
          </li>
        );
      })}
    </ol>
  );
}
