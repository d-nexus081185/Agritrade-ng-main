import { Icon } from "@/components/ui/Icon";

export function SearchBar({
  defaultQuery = "",
  defaultCategory = "",
  categories,
  compact = false,
}: {
  defaultQuery?: string;
  defaultCategory?: string;
  categories: { slug: string; name: string }[];
  compact?: boolean;
}) {
  return (
    <form action="/products" method="get" role="search" className={`search-bar ${compact ? "compact" : ""}`}>
      <Icon name="search" className="icon" />
      <label htmlFor={compact ? "q-compact" : "q-hero"} className="sr-only">Search products</label>
      <input
        id={compact ? "q-compact" : "q-hero"}
        name="q"
        type="search"
        defaultValue={defaultQuery}
        placeholder="Search eggs, catfish, yam, onions…"
        autoComplete="off"
        maxLength={100}
      />
      <label htmlFor={compact ? "cat-compact" : "cat-hero"} className="sr-only">Category</label>
      <select id={compact ? "cat-compact" : "cat-hero"} name="category" defaultValue={defaultCategory}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>{c.name}</option>
        ))}
      </select>
      <button className="btn" type="submit">Search</button>
    </form>
  );
}
