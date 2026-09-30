import Link from "next/link";

export function Pagination({ page, pages, params }: { page: number; pages: number; params: URLSearchParams }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams(params);
    if (p === 1) q.delete("page");
    else q.set("page", String(p));
    return `/products?${q.toString()}`;
  };
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 && <Link href={href(page - 1)} rel="prev">‹ Prev<span className="sr-only">ious page</span></Link>}
      {nums.map((n, i) => (
        <span key={n} style={{ display: "contents" }}>
          {i > 0 && n - nums[i - 1]! > 1 && <span aria-hidden="true">…</span>}
          {n === page ? (
            <span aria-current="page">{n}</span>
          ) : (
            <Link href={href(n)} aria-label={`Page ${n}`}>{n}</Link>
          )}
        </span>
      ))}
      {page < pages && <Link href={href(page + 1)} rel="next">Next ›<span className="sr-only"> page</span></Link>}
    </nav>
  );
}
