import { ProductGridSkeleton } from "@/components/market/ProductCard";

export default function Loading() {
  return (
    <div className="container" style={{ paddingTop: 28 }} role="status" aria-label="Loading products">
      <div className="route-progress" aria-hidden="true" />
      <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 40, width: "45%", marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 56, borderRadius: 999, marginBottom: 28 }} />
      <ProductGridSkeleton />
    </div>
  );
}
