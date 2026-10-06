import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";

const featuredProduce = [
  { title: "Premium tomatoes", location: "Ibadan", price: "₦4,200 / crate", image: "/images/tomatoes.jpg" },
  { title: "Fresh catfish", location: "Lagos", price: "₦8,600 / bag", image: "/images/catfish-fresh.jpg" },
  { title: "Farm eggs", location: "Ogun", price: "₦3,100 / tray", image: "/images/eggs-crate.jpg" },
];

/** Split-screen frame for sign-in, registration and password reset pages. */
export function AuthShell({ children, stats }: { children: React.ReactNode; stats?: { listings: number; sellers: number; states: number } }) {
  return (
    <div className="auth-layout">
      <aside className="auth-visual premium-visual" aria-label="About AgriTrade">
        <div className="premium-visual__bg">
          <Image src="/images/hero-field.jpg" alt="" fill sizes="50vw" className="bg" priority />
        </div>

        <div className="premium-visual__top">
          <Logo />
          <span className="premium-pill">Verified wholesale network</span>
        </div>

        <div className="premium-visual__content">
          <p className="eyebrow" style={{ color: "var(--earth-300)" }}>
            <Icon name="leaf" size={16} /> Farm to shelf, in bulk
          </p>
          <h2>Source reliable produce with confidence.</h2>
          <p>
            AgriTrade connects retailers, caterers, food businesses and wholesalers with trusted farm suppliers
            across Nigeria — from fresh vegetables to poultry, fish and staple grains.
          </p>

          {stats && (
            <div className="auth-stats premium-stats">
              <div><strong>{stats.listings}</strong><span>live listings</span></div>
              <div><strong>{stats.sellers}</strong><span>approved sellers</span></div>
              <div><strong>{stats.states}</strong><span>states covered</span></div>
            </div>
          )}
        </div>

        <div className="premium-showcase" aria-label="Featured produce">
          {featuredProduce.map((item) => (
            <article key={item.title} className="premium-showcase__card">
              <div className="premium-showcase__image-wrap">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 980px) 0px, 18vw"
                  className="premium-showcase__image"
                  loading="lazy"
                />
              </div>
              <div className="premium-showcase__body">
                <strong>{item.title}</strong>
                <span>{item.location}</span>
                <em>{item.price}</em>
              </div>
            </article>
          ))}
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
