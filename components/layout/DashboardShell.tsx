import { DashboardNav, type DashNavItem } from "./DashboardNav";

export function DashboardShell({
  label,
  items,
  children,
}: {
  label: string;
  items: DashNavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="container dash">
      <DashboardNav label={label} items={items} />
      <div className="dash-main">{children}</div>
    </div>
  );
}

export function PageHead({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <p className="eyebrow" style={{ margin: 0 }}>{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}
