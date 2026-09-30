import Image from "next/image";
import Link from "next/link";

type Cat = { slug: string; name: string; imageUrl: string | null; _count: { products: number } };

export function CategoryNav({ categories, active, baseQuery }: { categories: Cat[]; active?: string; baseQuery?: URLSearchParams }) {
  const hrefFor = (slug?: string) => {
    const p = new URLSearchParams(baseQuery);
    p.delete("page");
    if (slug) p.set("category", slug);
    else p.delete("category");
    const s = p.toString();
    return `/products${s ? `?${s}` : ""}`;
  };
  return (
    <nav aria-label="Product categories" className="category-nav">
      <Link href={hrefFor()} className="category-chip" aria-current={!active ? "true" : undefined} style={{ padding: "0 20px" }}>
        All produce
      </Link>
      {categories.map((c) => (
        <Link key={c.slug} href={hrefFor(c.slug)} className="category-chip" aria-current={active === c.slug ? "true" : undefined}>
          {c.imageUrl && <Image src={c.imageUrl} alt="" width={32} height={32} />}
          {c.name}
          <span className="count">{c._count.products}</span>
        </Link>
      ))}
    </nav>
  );
}
