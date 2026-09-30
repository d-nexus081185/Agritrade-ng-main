import Link from "next/link";
import { CategoryNav } from "@/components/market/CategoryNav";
import { FilterPanel } from "@/components/market/FilterPanel";
import { Pagination } from "@/components/market/Pagination";
import { ProductGrid } from "@/components/market/ProductCard";
import { SearchBar } from "@/components/market/SearchBar";
import { EmptyState } from "@/components/ui/States";
import { Icon } from "@/components/ui/Icon";
import { AVAILABILITY_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getCategories, publicListingWhere, searchListings } from "@/lib/queries";
import { marketplaceFilterSchema } from "@/lib/validation";
import { getViewer } from "@/lib/viewer";

export const metadata = { title: "Browse products" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const flat = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([, v]) => v !== "" && v != null));
  const filters = marketplaceFilterSchema.parse(flat);

  const [categories, results, viewer, stateRows] = await Promise.all([
    getCategories(),
    searchListings(filters),
    getViewer(),
    db.product.findMany({ where: publicListingWhere, distinct: ["state"], select: { state: true } }),
  ]);

  const params = new URLSearchParams(
    Object.entries(filters).filter(([k, v]) => v != null && v !== "" && k !== "page" && !(k === "sort" && v === "newest")).map(([k, v]) => [k, String(v)]),
  );
  const activeCat = categories.find((c) => c.slug === filters.category);

  const chips: { label: string; remove: string }[] = [];
  const without = (key: string) => {
    const p = new URLSearchParams(params);
    p.delete(key);
    if (key === "minPrice") p.delete("maxPrice");
    return `/products${p.toString() ? `?${p}` : ""}`;
  };
  if (filters.q) chips.push({ label: `“${filters.q}”`, remove: without("q") });
  if (activeCat) chips.push({ label: activeCat.name, remove: without("category") });
  if (filters.state) chips.push({ label: filters.state, remove: without("state") });
  if (filters.availability) chips.push({ label: AVAILABILITY_LABELS[filters.availability], remove: without("availability") });
  if (filters.minPrice != null || filters.maxPrice != null)
    chips.push({
      label: `${filters.minPrice != null ? formatPrice(filters.minPrice) : "₦0"} – ${filters.maxPrice != null ? formatPrice(filters.maxPrice) : "any"}`,
      remove: without("minPrice"),
    });

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Marketplace</p>
          <h1>{activeCat ? activeCat.name : filters.q ? `Results for “${filters.q}”` : "All farm produce"}</h1>
          {activeCat?.description && <p className="muted">{activeCat.description}</p>}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <SearchBar compact categories={categories} defaultQuery={filters.q} defaultCategory={filters.category} />
      </div>
      <CategoryNav categories={categories} active={filters.category} baseQuery={params} />

      <div className="browse" style={{ marginTop: 20 }}>
        <FilterPanel filters={filters} categories={categories} statesWithStock={stateRows.map((r) => r.state)} />

        <section aria-labelledby="results-heading">
          <div className="results-bar">
            <div>
              <h2 id="results-heading" className="small" style={{ fontFamily: "var(--font-body)", margin: 0, fontWeight: 600 }} aria-live="polite">
                {results.total} listing{results.total === 1 ? "" : "s"} found
              </h2>
              {chips.length > 0 && (
                <div className="active-filters" style={{ marginTop: 8 }}>
                  {chips.map((c) => (
                    <Link key={c.label} href={c.remove} aria-label={`Remove filter ${c.label}`}>
                      {c.label} <Icon name="x" size={14} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <form action="/products" method="get" className="inline-form">
              {Array.from(params.entries()).filter(([k]) => k !== "sort").map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              <label htmlFor="sort" className="small muted">Sort</label>
              <select id="sort" name="sort" className="select" defaultValue={filters.sort}>
                <option value="newest">Newest first</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
              <button type="submit" className="btn btn-secondary btn-sm">Apply</button>
            </form>
          </div>

          {results.items.length ? (
            <>
              <ProductGrid products={results.items} viewer={viewer} />
              <Pagination page={filters.page} pages={results.pages} params={params} />
            </>
          ) : (
            <EmptyState title="No matching listings" action={{ href: "/products", label: "Clear all filters" }}>
              Try a broader search, another state, or remove the price range. New stock is added by sellers every day.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
