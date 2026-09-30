import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-furrows" aria-hidden="true" />
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p style={{ marginTop: 14, maxWidth: "42ch" }}>
              A wholesale marketplace linking Nigerian retailers and food businesses with the farms, fisheries and
              aggregators that supply them.
            </p>
          </div>
          <div>
            <h2>Marketplace</h2>
            <ul>
              <li><Link href="/products">Browse products</Link></li>
              <li><Link href="/products?category=eggs">Eggs</Link></li>
              <li><Link href="/products?category=fish-seafood">Fish &amp; seafood</Link></li>
              <li><Link href="/products?category=yam-tubers">Yam &amp; tubers</Link></li>
            </ul>
          </div>
          <div>
            <h2>Get started</h2>
            <ul>
              <li><Link href="/?mode=register">Create a buyer account</Link></li>
              <li><Link href="/?mode=register&role=seller">Sell on AgriTrade</Link></li>
              <li><Link href="/?mode=login">Sign in</Link></li>
              <li><Link href="/credits">Photo credits</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-base row-between">
          <span>© {new Date().getFullYear()} AgriTrade. Prototype — listings marked “Sample” are demo data.</span>
          <span>Prices in Nigerian Naira (₦).</span>
        </div>
      </div>
    </footer>
  );
}
