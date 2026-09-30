"use client";

import { useActionState } from "react";
import { recordPayoutAction, updatePayoutDetailsAction } from "@/app/actions/orders";
import { FormMessage, SubmitButton, TextField } from "@/components/ui/Form";
import type { ActionState } from "@/lib/validation";

type PayoutValues = { payoutBankName: string; payoutAccountNumber: string; payoutAccountName: string };

/** Seller's bank account for receiving released escrow funds. */
export function PayoutDetailsForm({ initial }: { initial: PayoutValues }) {
  const [state, action] = useActionState<ActionState, FormData>(updatePayoutDetailsAction, {});
  const val = (k: keyof PayoutValues) => (state.values?.[k] as string | undefined) ?? initial[k];
  return (
    <form action={action} noValidate className="card card-pad stack" style={{ ["--stack" as string]: "16px" }}>
      <div>
        <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Payout account</h2>
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          Buyers pay AgriTrade, and we hold the money in escrow. When a buyer confirms delivery, your payment is sent to this account.
        </p>
      </div>
      <FormMessage state={state} />
      <div className="field-row">
        <TextField name="payoutBankName" label="Bank" state={state} defaultValue={val("payoutBankName")} placeholder="e.g. Access Bank" />
        <TextField name="payoutAccountNumber" label="Account number (NUBAN)" inputMode="numeric" maxLength={10} state={state} defaultValue={val("payoutAccountNumber")} />
      </div>
      <TextField name="payoutAccountName" label="Account name" state={state} defaultValue={val("payoutAccountName")} hint="Must match your registered business or your own name." />
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <SubmitButton pendingLabel="Saving…">Save payout account</SubmitButton>
      </div>
    </form>
  );
}

/** Admin records the bank transfer that paid out a released order. */
export function PayoutRecordForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(recordPayoutAction, {});
  if (state.ok) return <span className="badge">Paid out</span>;
  return (
    <form action={action} className="inline-form" noValidate>
      <input type="hidden" name="orderId" value={orderId} />
      <label className="sr-only" htmlFor={`payout-${orderId}`}>Transfer reference</label>
      <input
        id={`payout-${orderId}`}
        name="payoutRef"
        className="input"
        style={{ minHeight: 36, padding: "4px 10px", fontSize: "0.85rem", width: 170 }}
        placeholder="Transfer reference"
        required
        aria-invalid={state.fieldErrors?.payoutRef ? true : undefined}
        title={state.fieldErrors?.payoutRef?.[0] ?? state.message}
      />
      <SubmitButton className="btn btn-sm" pendingLabel="Saving…">Mark paid</SubmitButton>
      {state.message && !state.ok && <span className="small" style={{ color: "var(--danger)" }} role="alert">{state.fieldErrors?.payoutRef?.[0] ?? state.message}</span>}
    </form>
  );
}
