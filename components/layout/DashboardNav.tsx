"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

export type DashNavItem = { href: string; label: string; icon: IconName; count?: number; exact?: boolean };

export function DashboardNav({ label, items }: { label: string; items: DashNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="dash-nav" aria-label={`${label} navigation`}>
      <span className="role-label eyebrow">{label}</span>
      {items.map((item) => {
        const path = item.href.split("?")[0]!;
        const current = item.exact ? pathname === path : pathname === path || pathname.startsWith(path + "/");
        return (
          <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined}>
            <Icon name={item.icon} />
            {item.label}
            {item.count ? (
              <span className="count">
                {item.count}
                <span className="sr-only"> pending</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
