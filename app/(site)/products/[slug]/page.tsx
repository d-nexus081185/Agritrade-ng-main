import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/market/Gallery";
import { InquiryForm } from "@/components/market/InquiryForm";
import { ReportForm } from "@/components/market/ReportForm";
import { ProductGrid } from "@/components/market/ProductCard";
import { SaveButton } from "@/components/market/SaveButton";
import { Icon } from "@/components/ui/Icon";
import { Notice, StatusBadge } from "@/components/ui/States";
import { db } from "@/lib/db";
import { deliveryLabel, formatDate, formatNumber, formatPrice, initials, parseDeliveryOptions } from "@/lib/format";
import { productCardInclude, publicListingWhere } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      seller: { include: { user: { select: { id: true, status: true } }, _count: { select: { products: { where: publicListingWhere } } } } },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }) {
  const product = await load((await params).slug);
  return { title: product?.status === "ACTIVE" ? product.title : "Listing" };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, viewer] = await Promise.all([load(slug), getViewer()]);
  if (!product) notFound();

  const isPublic = product.status === "ACTIVE" && product.seller.user.status === "ACTIVE";
  const isOwner = viewer.user?.id === product.seller.user.id;
  const isAdmin = viewer.user?.role === "ADMIN";
  if (!isPublic && !isOwner && !isAdmin) notFound();

  const related = await db.product.findMany({
    where: { ...publicListingWhere, categoryId: product.categoryId, NOT: { id: product.id } },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const delivery = parseDeliveryOptions(product.deliveryOptions);

  return (
    <div className="container">
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <ol>
          <li><Link href="/marketplace">Marketplace</Link></li>
          <li><Link href={`/products?category=${product.category.slug}`}>{product.category.name}</Link></li>
          <li aria-current="page">{product.title}</li>
        </ol>
      </nav>

      {!isPublic && (
        <Notice tone="warn">
          Preview only — this listing is <strong>{product.status.toLowerCase()}</strong>
          {product.seller.user.status !== "ACTIVE" && " and the seller account is not yet approved"}, so buyers can&apos;t see it.
        </Notice>
      )}

      <div className="detail">
        <Gallery images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt || product.title }))} title={product.title} />

        <div>
          <div className="row" style={{ marginBottom: 10 }}>
            <StatusBadge status={product.availability} />
            <span className="badge badge-neutral no-dot">{product.category.name}</span>
            {product.isSample && <span className="badge badge-earth no-dot" title="Demo data created by the seed script">Sample listing</span>}
          </div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>{product.title}</h1>
          <p className={`detail-price ${product.price == null ? "quote" : ""}`}>
            {formatPrice(product.price)}
            {product.price != null && <small> per {product.unit}</small>}
          </p>
          {product.price == null && <p className="muted small">The seller prices this on request — send an inquiry with your quantity.</p>}

          <dl className="facts">
            <div className="fact"><dt>Minimum order</dt><dd>{formatNumber(product.minOrderQty)} × {product.unit}</dd></div>
            <div className="fact"><dt>Available</dt><dd>{product.availability === "OUT_OF_STOCK" ? "None right now" : `${formatNumber(product.quantityAvailable)} × ${product.unit}`}</dd></div>
            <div className="fact"><dt>Location</dt><dd>{product.city}, {product.state}</dd></div>
            <div className="fact"><dt>Delivery</dt><dd>{deliveryLabel(product.deliveryOptions)}</dd></div>
          </dl>

          <div className="row" style={{ marginBottom: 20 }}>
            <SaveButton productId={product.id} productTitle={product.title} initialSaved={viewer.savedIds.has(product.id)} canSave={viewer.canSave} isGuest={viewer.isGuest} large />
            {isOwner && <Link href={`/seller/listings/${product.id}/edit`} className="btn btn-secondary"><Icon name="edit" size={16} /> Edit listing</Link>}
          </div>

          <div className="card card-pad" id="inquire">
            <h2 style={{ fontSize: "1.3rem" }}>Contact the seller</h2>
            {viewer.user?.role === "BUYER" && isPublic ? (
              product.availability === "OUT_OF_STOCK" ? (
                <p className="muted" style={{ margin: 0 }}>This product is out of stock. Save it and check back soon.</p>
              ) : (
                <InquiryForm productId={product.id} unit={product.unit} minOrderQty={product.minOrderQty} deliveryOptions={delivery} />
              )
            ) : viewer.isGuest ? (
              <>
                <p className="muted">Sign in with a buyer account to request a quote, ask about quality or arrange delivery.</p>
                <div className="row">
                  <Link href={`/?mode=login&next=/products/${product.slug}`} className="btn">Sign in to inquire</Link>
                  <Link href="/?mode=register" className="btn btn-secondary">Create buyer account</Link>
                </div>
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                {isOwner ? "This is your listing. Buyer inquiries appear in your seller dashboard." : "Only buyer accounts can send inquiries."}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="two-col" style={{ marginTop: 40 }}>
        <section className="card card-pad" aria-labelledby="about-heading">
          <h2 id="about-heading" style={{ fontSize: "1.3rem" }}>About this product</h2>
          <p className="prose">{product.description}</p>
          <p className="small muted" style={{ margin: 0 }}>Listed {formatDate(product.createdAt)} · Updated {formatDate(product.updatedAt)}</p>
        </section>

        <section className="card card-pad" aria-labelledby="seller-heading">
          <h2 id="seller-heading" style={{ fontSize: "1.3rem" }}>Sold by</h2>
          <div className="seller-card">
            <span className="avatar" aria-hidden="true">{initials(product.seller.businessName)}</span>
            <div>
              <Link href={`/sellers/${product.seller.slug}`} style={{ fontWeight: 700, fontSize: "1.05rem" }}>{product.seller.businessName}</Link>
              <div className="small muted">
                <Icon name="pin" size={14} /> {product.seller.city}, {product.seller.state}
                {product.seller.yearsInBusiness != null && <> · {product.seller.yearsInBusiness} yrs trading</>}
              </div>
            </div>
          </div>
          {product.seller.description && <p className="muted" style={{ marginTop: 14 }}>{product.seller.description.slice(0, 220)}{product.seller.description.length > 220 ? "…" : ""}</p>}
          <div className="row small" style={{ marginTop: 10 }}>
            {product.seller.user.status === "ACTIVE" ? (
              <span className="badge no-dot"><Icon name="shield" size={13} /> Approved seller</span>
            ) : (
              <span className="badge badge-warn no-dot">Awaiting approval</span>
            )}
            <span className="muted">{product.seller._count.products} live listing{product.seller._count.products === 1 ? "" : "s"}</span>
          </div>
          {viewer.user && !isOwner && isPublic && (
            <>
              <hr className="divider" />
              <ReportForm productId={product.id} />
            </>
          )}
        </section>
      </div>

      {related.length > 0 && (
        <section className="section" aria-labelledby="related-heading">
          <div className="section-head">
            <h2 id="related-heading">More {product.category.name.toLowerCase()}</h2>
            <Link href={`/products?category=${product.category.slug}`} className="btn btn-secondary btn-sm">View all</Link>
          </div>
          <ProductGrid products={related} viewer={viewer} />
        </section>
      )}
    </div>
  );
}
