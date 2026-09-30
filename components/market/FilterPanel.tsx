import Link from "next/link";
import { AVAILABILITY, AVAILABILITY_LABELS, NIGERIAN_STATES } from "@/lib/constants";
import type { MarketplaceFilters } from "@/lib/validation";
import { FilterToggle } from "./FilterToggle";

export function FilterPanel({
  filters,
  categories,
  statesWithStock,
}: {
  filters: MarketplaceFilters;
  categories: { slug: string; name: string }[];
  statesWithStock: string[];
}) {
  const stateOptions = NIGERIAN_STATES.filter((s) => statesWithStock.includes(s) || s === filters.state);
  return (
    <aside className="filters card card-pad" aria-labelledby="filters-heading">
      <FilterToggle>
        <form action="/products" method="get">
          {filters.q && <input type="hidden" name="q" value={filters.q} />}
          <input type="hidden" name="sort" value={filters.sort} />

          <fieldset className="filter-group" style={{ borderTop: 0, marginTop: 0, paddingTop: 0 }}>
            <legend>Category</legend>
            <div className="radio-list">
              <label><input type="radio" name="category" value="" defaultChecked={!filters.category} /> All categories</label>
              {categories.map((c) => (
                <label key={c.slug}>
                  <input type="radio" name="category" value={c.slug} defaultChecked={filters.category === c.slug} /> {c.name}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="filter-group">
            <label className="label" htmlFor="filter-state" style={{ display: "block" }}>Location (state)</label>
            <select id="filter-state" name="state" className="select" defaultValue={filters.state ?? ""}>
              <option value="">Anywhere in Nigeria</option>
              {stateOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <fieldset className="filter-group">
            <legend>Price per unit (₦)</legend>
            <div className="price-range">
              <label className="sr-only" htmlFor="minPrice">Minimum price</label>
              <input id="minPrice" name="minPrice" type="number" min={0} inputMode="numeric" className="input" placeholder="Min" defaultValue={filters.minPrice ?? ""} />
              <span aria-hidden="true">–</span>
              <label className="sr-only" htmlFor="maxPrice">Maximum price</label>
              <input id="maxPrice" name="maxPrice" type="number" min={0} inputMode="numeric" className="input" placeholder="Max" defaultValue={filters.maxPrice ?? ""} />
            </div>
            <p className="hint" style={{ marginTop: 6 }}>Price filters hide “request a quote” listings.</p>
          </fieldset>

          <fieldset className="filter-group">
            <legend>Availability</legend>
            <div className="radio-list">
              <label><input type="radio" name="availability" value="" defaultChecked={!filters.availability} /> Any</label>
              {AVAILABILITY.map((a) => (
                <label key={a}>
                  <input type="radio" name="availability" value={a} defaultChecked={filters.availability === a} /> {AVAILABILITY_LABELS[a]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="filter-group" style={{ display: "grid", gap: 8 }}>
            <button type="submit" className="btn btn-block">Apply filters</button>
            <Link href={filters.q ? `/products?q=${encodeURIComponent(filters.q)}` : "/products"} className="btn btn-ghost btn-block">
              Clear filters
            </Link>
          </div>
        </form>
      </FilterToggle>
    </aside>
  );
}
