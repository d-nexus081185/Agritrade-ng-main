import Link from "next/link";
import { titleCase } from "@/lib/format";

/** Chip-style status filter links, e.g. All / Open / Responded / Closed. */
export function StatusTabs({ base, active, statuses }: { base: string; active?: string; statuses: readonly string[] }) {
  const tabs = [{ key: undefined as string | undefined, label: "All" }, ...statuses.map((s) => ({ key: s, label: titleCase(s) }))];
  return (
    <nav aria-label="Filter by status" className="category-nav" style={{ marginBottom: 16 }}>
      {tabs.map((t) => (
        <Link
          key={t.label}
          href={t.key ? `${base}?status=${t.key}` : base}
          className="category-chip"
          style={{ paddingLeft: 16 }}
          aria-current={active === t.key ? "true" : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
