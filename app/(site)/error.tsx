"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Sprout } from "@/components/ui/Sprout";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="error-page" role="alert">
      <Sprout className="sprout-art" />
      <h1 style={{ fontSize: "2rem" }}>Something went wrong</h1>
      <p className="muted">
        We couldn&apos;t load this page. This is usually temporary — please try again. If it keeps happening, check that
        the database is running and migrated.
      </p>
      <div className="row" style={{ justifyContent: "center" }}>
        <button type="button" className="btn" onClick={reset}>Try again</button>
        <Link href="/marketplace" className="btn btn-secondary">Go to marketplace</Link>
      </div>
      {error.digest && <p className="small muted" style={{ marginTop: 16 }}>Reference: {error.digest}</p>}
    </div>
  );
}
