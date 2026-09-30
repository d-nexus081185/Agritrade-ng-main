"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { initials } from "@/lib/format";

type HeaderUser = { name: string; role: string; dashboard: string } | null;

const ROLE_LABEL: Record<string, string> = { BUYER: "Buyer", SELLER: "Seller", ADMIN: "Admin" };

export function HeaderNav({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/products", label: "Browse products" },
    ...(user ? [{ href: user.dashboard, label: "Dashboard" }] : []),
  ];
  const isCurrent = (href: string) => pathname === href || (href !== "/marketplace" && pathname.startsWith(href + "/"));

  return (
    <header className="site-header">
      <div className="container bar">
        <Logo />
        <nav aria-label="Main" className="nav-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isCurrent(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link href="/account" className="user-chip desktop-only" style={{ textDecoration: "none", color: "inherit" }}>
                <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
                <span>
                  {user.name.split(" ")[0]}
                  <span className="sr-only">, {ROLE_LABEL[user.role]} account settings</span>
                </span>
                <span className="badge badge-earth no-dot" aria-hidden="true">{ROLE_LABEL[user.role]}</span>
              </Link>
              <form action={logoutAction} className="desktop-only">
                <button className="btn btn-ghost btn-sm" type="submit">
                  <Icon name="logout" size={16} /> Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/?mode=login" className="btn btn-ghost btn-sm desktop-only">Sign in</Link>
              <Link href="/?mode=register" className="btn btn-sm">Join free</Link>
            </>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-icon menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? "x" : "menu"} />
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
          <ul className="container">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={isCurrent(l.href) ? "page" : undefined}>{l.label}</Link>
              </li>
            ))}
            {user ? (
              <>
                <li><Link href="/account">Account settings</Link></li>
                <li>
                  <form action={logoutAction}>
                    <button type="submit" className="linklike">Sign out</button>
                  </form>
                </li>
              </>
            ) : (
              <li><Link href="/?mode=login">Sign in</Link></li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
