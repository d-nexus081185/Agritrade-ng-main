import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/States";
import { formatNumber, formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/queries";
import { ProductImage } from "./ProductImage";
import { SaveButton } from "./SaveButton";

export type Viewer = { isGuest: boolean; canSave: boolean; savedIds: Set<string> };

export function ProductCard({ product, viewer, index = 0 }: { product: ProductCardData; viewer: Viewer; index?: number }) {
  const img = product.images[0];
  return (
    <article className="product-card" style={{ ["--i" as string]: Math.min(index, 11) }}>
      <div className="media">
        <ProductImage src={img?.url} alt={img?.alt || product.title} sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 300px" />
        <div className="badges">
          <StatusBadge status={product.availability} />
          {product.isSample && <span className="badge badge-earth no-dot">Sample</span>}
        </div>
      </div>
      <SaveButton
        productId={product.id}
        productTitle={product.title}
        initialSaved={viewer.savedIds.has(product.id)}
        canSave={viewer.canSave}
        isGuest={viewer.isGuest}
      />
      <div className="body">
        <span className="cat">{product.category.name}</span>
        <h3>
          <Link href={`/products/${product.slug}`}>{product.title}</Link>
        </h3>
        <div className={`price ${product.price == null ? "quote" : ""}`}>
          {formatPrice(product.price)}
          {product.price != null && <small> / {product.unit}</small>}
        </div>
        <div className="meta">
          <span><Icon name="pin" size={15} /> {product.city}, {product.state}</span>
          <span><Icon name="store" size={15} /> {product.seller.businessName}</span>
          <span><Icon name="scale" size={15} /> Min. order {formatNumber(product.minOrderQty)} × {product.unit}</span>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, viewer }: { products: ProductCardData[]; viewer: Viewer }) {
  return (
    <div className="product-grid">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} viewer={viewer} index={i} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton" style={{ aspectRatio: "4 / 3" }} />
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            <div className="skeleton" style={{ height: 12, width: "40%" }} />
            <div className="skeleton" style={{ height: 18, width: "85%" }} />
            <div className="skeleton" style={{ height: 18, width: "50%" }} />
            <div className="skeleton" style={{ height: 40 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
