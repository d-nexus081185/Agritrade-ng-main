"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSaveAction } from "@/app/actions/marketplace";
import { Icon } from "@/components/ui/Icon";

/**
 * Heart toggle for saving a product. Guests are sent to sign in; non-buyers see an explanation.
 */
export function SaveButton({
  productId,
  productTitle,
  initialSaved,
  canSave,
  isGuest,
  large = false,
}: {
  productId: string;
  productTitle: string;
  initialSaved: boolean;
  canSave: boolean;
  isGuest: boolean;
  large?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [optimisticSaved, setOptimistic] = useOptimistic(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canSave && !isGuest) return null;

  function onClick() {
    if (isGuest) {
      router.push(`/?mode=login&next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    startTransition(async () => {
      setOptimistic(!saved);
      const res = await toggleSaveAction(productId);
      if (res.error) setError(res.error);
      else {
        setError(null);
        setSaved(res.saved);
      }
    });
  }

  const label = optimisticSaved ? `Remove ${productTitle} from saved` : `Save ${productTitle}`;
  return (
    <>
      <button
        type="button"
        className={`save-btn ${large ? "lg" : ""}`}
        aria-pressed={optimisticSaved}
        aria-label={large ? undefined : label}
        title={label}
        onClick={onClick}
        disabled={pending}
      >
        <Icon name="heart" filled={optimisticSaved} size={large ? 18 : 19} />
        {large && <span>{optimisticSaved ? "Saved" : "Save product"}</span>}
      </button>
      {error && <span role="alert" className="sr-only">{error}</span>}
    </>
  );
}
