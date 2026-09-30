import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Sprout } from "@/components/ui/Sprout";
import { EmptyState } from "@/components/ui/States";
import { SearchBar } from "@/components/market/SearchBar";
import { ProductGrid } from "@/components/market/ProductCard";
import { db } from "@/lib/db";
import { getCategories, productCardInclude, publicListingWhere } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

export const metadata = { title: "Marketplace" };
export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const [categories, latest, viewer] = await Promise.all([
    getCategories(),
    db.product.findMany({ where: publicListingWhere, include: productCardInclude, orderBy: { createdAt: "desc" }, take: 8 }),
    getViewer(),
  ]);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <Image src="/images/hero-field.jpg" alt="" fill priority sizes="100vw" className="bg" />
        <div className="container">
          <p className="eyebrow grow-in"><Icon name="leaf" size={16} /> Wholesale farm produce, direct from source</p>
          <h1 id="hero-title" className="grow-in" style={{ ["--i" as string]: 1 }}>
            Stock your shelves straight from Nigeria&apos;s farms.
          </h1>
          <p className="lead grow-in" style={{ ["--i" as string]: 2 }}>
            Compare wholesale offers on eggs, poultry, fish, yam, onions and more — then message the seller to agree
            quantities, delivery and price.
          </p>
          <div className="grow-in" style={{ ["--i" as string]: 3 }}>
            <SearchBar categories={categories} />
          </div>
          <div className="row grow-in" style={{ marginTop: 18, ["--i" as string]: 4 }}>
            <span className="small" style={{ color: "#c8dccd" }}>Popular:</span>
            {["Crate of eggs", "Smoked catfish", "Yam", "Onions"].map((t) => (
              <Link key={t} href={`/products?q=${encodeURIComponent(t)}`} className="badge no-dot" style={{ background: "rgb(255 255 255 / 14%)", color: "#fff", textDecoration: "none" }}>
                {t}
              </Link>
            ))}
          </div>
        </div>
        <Sprout className="hero-sprout sway" />
      </section>

      <div className="container">
        <section className="section" aria-labelledby="cat-title" style={{ marginTop: 0 }}>
          <div className="section-head">
            <div>
              <p className="eyebrow">Shop by category</p>
              <h2 id="cat-title">What are you stocking up on?</h2>
            </div>
            <Link href="/products" className="btn btn-secondary btn-sm">All products <Icon name="arrowRight" size={16} /></Link>
          </div>
          {categories.length === 0 ? (
            <EmptyState title="No categories yet">An admin needs to add product categories before listings can be published.</EmptyState>
          ) : (
            <div className="category-tiles">
              {categories.slice(0, 8).map((c, i) => (
                <Link key={c.id} href={`/products?category=${c.slug}`} className="category-tile grow-in" style={{ ["--i" as string]: i }}>
                  {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="(max-width: 760px) 50vw, 25vw" />}
                  <div>
                    <strong>{c.name}</strong>
                    <span>{c._count.products} listing{c._count.products === 1 ? "" : "s"}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section" aria-labelledby="latest-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Fresh on the market</p>
              <h2 id="latest-title">Latest wholesale offers</h2>
            </div>
            <Link href="/products?sort=newest" className="btn btn-secondary btn-sm">See everything <Icon name="arrowRight" size={16} /></Link>
          </div>
          {latest.length ? (
            <ProductGrid products={latest} viewer={viewer} />
          ) : (
            <EmptyState title="No listings yet" action={{ href: "/?mode=register&role=seller", label: "Become a seller" }}>
              Approved listings will appear here. Run <code>npm run db:seed</code> to load the sample catalogue.
            </EmptyState>
          )}
        </section>

        <section className="section" aria-labelledby="how-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">How AgriTrade works</p>
              <h2 id="how-title">Built for bulk buying</h2>
            </div>
          </div>
          <div className="value-props">
            <div className="value-prop grow-in">
              <div className="icon"><Icon name="search" size={22} /></div>
              <h3>Compare real wholesale offers</h3>
              <p className="muted">Filter by category, state, price and stock. Every listing shows its minimum order and delivery options up front.</p>
            </div>
            <div className="value-prop grow-in" style={{ ["--i" as string]: 1 }}>
              <div className="icon"><Icon name="chat" size={22} /></div>
              <h3>Talk directly to sellers</h3>
              <p className="muted">Send an inquiry with your quantity and delivery preference. Negotiate and confirm in one tracked conversation.</p>
            </div>
            <div className="value-prop grow-in" style={{ ["--i" as string]: 2 }}>
              <div className="icon"><Icon name="shield" size={22} /></div>
              <h3>Reviewed sellers &amp; listings</h3>
              <p className="muted">Our team approves new sellers and listings before they go live, and acts quickly on reported content.</p>
            </div>
          </div>
        </section>

        {!viewer.user && (
          <section className="cta-band" aria-labelledby="cta-title">
            <div>
              <h2 id="cta-title">Have produce to sell in bulk?</h2>
              <p className="muted" style={{ margin: 0 }}>List your eggs, birds, fish or crops and reach retailers across Nigeria. It&apos;s free to join.</p>
            </div>
            <div className="row">
              <Link href="/?mode=register&role=seller" className="btn btn-earth">Start selling</Link>
              <Link href="/?mode=register" className="btn btn-secondary">I&apos;m a buyer</Link>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
