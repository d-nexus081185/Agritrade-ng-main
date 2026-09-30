import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";

/** Split-screen frame for sign-in, registration and password reset pages. */
export function AuthShell({ children, stats }: { children: React.ReactNode; stats?: { listings: number; sellers: number; states: number } }) {
  return (
    <div className="auth-layout">
      <aside className="auth-visual" aria-label="About AgriTrade">
        <Image src="/images/farmer.jpg" alt="" fill priority sizes="50vw" className="bg" />
        <Logo />
        <div>
          <p className="eyebrow" style={{ color: "var(--earth-300)" }}>
            <Icon name="leaf" size={16} /> Farm to shelf, in bulk
          </p>
          <h2>Buy straight from the people who grow it.</h2>
          <p>
            AgriTrade connects retailers, caterers and food businesses with wholesale sellers of eggs, poultry,
            fish, yam, onions and fresh produce across Nigeria.
          </p>
          {stats && (
            <div className="auth-stats">
              <div><strong>{stats.listings}</strong><span>live listings</span></div>
              <div><strong>{stats.sellers}</strong><span>approved sellers</span></div>
              <div><strong>{stats.states}</strong><span>states covered</span></div>
            </div>
          )}
        </div>
      </aside>
      <main id="main" className="auth-panel">
        <div className="auth-inner">
          <div className="auth-mobile-brand">
            <Logo />
            <Link href="/marketplace" className="btn btn-ghost btn-sm">
              Browse marketplace <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
