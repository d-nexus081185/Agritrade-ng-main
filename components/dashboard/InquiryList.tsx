import Link from "next/link";
import { ProductImage } from "@/components/market/ProductImage";
import { StatusBadge } from "@/components/ui/States";
import { formatDateTime, formatNumber } from "@/lib/format";

export type InquiryRow = {
  id: string;
  productTitle: string;
  quantity: number;
  status: string;
  updatedAt: Date;
  counterpart: string;
  unit?: string;
  imageUrl?: string;
  lastMessage?: string;
};

export function InquiryList({ rows }: { rows: InquiryRow[] }) {
  return (
    <ul className="list">
      {rows.map((r, i) => (
        <li key={r.id} className="list-item grow-in" style={{ ["--i" as string]: Math.min(i, 8) }}>
          <div style={{ position: "relative", width: 56, height: 46, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
            <ProductImage src={r.imageUrl} alt="" sizes="56px" />
          </div>
          <div className="grow">
            <Link href={`/inquiries/${r.id}`} className="title">{r.productTitle}</Link>
            <div className="small muted truncate">
              {r.counterpart} · {formatNumber(r.quantity)}{r.unit ? ` × ${r.unit}` : ""}
              {r.lastMessage ? ` · “${r.lastMessage}”` : ""}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <StatusBadge status={r.status} />
            <div className="small muted" style={{ marginTop: 4 }}>{formatDateTime(r.updatedAt)}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
