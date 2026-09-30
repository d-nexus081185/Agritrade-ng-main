"use client";

import { useActionState } from "react";
import { openDisputeAction } from "@/app/actions/orders";
import { FieldError, FormMessage, SubmitButton } from "@/components/ui/Form";
import type { ActionState } from "@/lib/validation";

/** Buyer reports a problem; the payment stays frozen in escrow until an admin settles it. */
export function DisputeForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(openDisputeAction, {});
  return (
    <details className="dispute" open={Boolean(state.message) || undefined}>
      <summary className="btn btn-ghost btn-sm">Report a problem with this order</summary>
      <form action={action} className="stack" style={{ ["--stack" as string]: "10px", marginTop: 10 }}>
        <FormMessage state={state} />
        <input type="hidden" name="orderId" value={orderId} />
        <label className="label" htmlFor="dispute-reason">What went wrong?</label>
        <textarea
          id="dispute-reason"
          name="reason"
          className="textarea"
          required
          minLength={10}
          maxLength={1000}
          placeholder="e.g. Goods not delivered, wrong quantity, poor quality…"
          defaultValue={(state.values?.reason as string) ?? ""}
          aria-invalid={state.fieldErrors?.reason ? true : undefined}
          aria-describedby={state.fieldErrors?.reason ? "dispute-reason-err" : undefined}
        />
        <FieldError id="dispute-reason-err" errors={state.fieldErrors?.reason} />
        <p className="small muted" style={{ margin: 0 }}>Your money stays in escrow while AgriTrade reviews the dispute with you and the seller.</p>
        <SubmitButton className="btn btn-danger btn-sm" pendingLabel="Opening…">Open dispute</SubmitButton>
      </form>
    </details>
  );
}
