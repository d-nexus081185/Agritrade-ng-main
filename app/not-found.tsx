import Link from "next/link";
import { Sprout } from "@/components/ui/Sprout";

export default function NotFound() {
  return (
    <main id="main" className="error-page">
      <Sprout />
      <h1 style={{ fontSize: "2rem" }}>Nothing growing here</h1>
      <p className="muted">The page or listing you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
      <div className="row" style={{ justifyContent: "center" }}>
        <Link href="/marketplace" className="btn">Go to marketplace</Link>
        <Link href="/products" className="btn btn-secondary">Browse products</Link>
      </div>
    </main>
  );
}
