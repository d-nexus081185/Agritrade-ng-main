"use client";

import { useActionState, useState } from "react";
import { createOfferAction } from "@/app/actions/orders";
import { FieldError, FormMessage, SubmitButton, TextField } from "@/components/ui/Form";
import { DELIVERY_LABELS, type DeliveryOption } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { ActionState } from "@/lib/validation";

/** Seller's "Request payment" form inside an inquiry. Shows the escrow total as they type. */
export function OfferForm({
  inquiryId,
  unit,
  defaultQuantity,
  defaultUnitPrice,
  defaultDelivery,
  deliveryOptions,
  feePercent,
}: {
  inquiryId: string;
  unit: string;
  defaultQuantity: number;
  defaultUnitPrice?: number | null;
  defaultDelivery: string;
  deliveryOptions: DeliveryOption[];
  feePercent: number;
}) {
  const [state, action] = useActionState<ActionState, FormData>(createOfferAction, {});
  const e = state.ok ? {} : (state.values ?? {});
  const [qty, setQty] = useState(String(e.quantity ?? defaultQuantity));
  const [price, setPrice] = useState(String(e.unitPrice ?? defaultUnitPrice ?? ""));
  const [fee, setFee] = useState(String(e.deliveryFee ?? ""));
  const n = (s: string) => (Number.isFinite(Number(s)) && Number(s) > 0 ? Math.floor(Number(s)) : 0);
  const total = n(qty) * n(price) + n(fee);
  const commission = Math.round((total * feePercent) / 100);
  const options = deliveryOptions.length ? deliveryOptions : (["PICKUP", "DELIVERY"] as DeliveryOption[]);

  return (
    <form action={action} className="stack" style={{ ["--stack" as string]: "14px" }} noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <div className="field-row">
        <TextField name="quantity" label={`Quantity (${unit})`} type="number" min={1} inputMode="numeric" state={state} value={qty} onChange={(ev) => setQty(ev.target.value)} />
        <TextField name="unitPrice" label="Price per unit (₦)" type="number" min={1} inputMode="numeric" state={state} value={price} onChange={(ev) => setPrice(ev.target.value)} />
      </div>
      <div className="field-row">
        <TextField name="deliveryFee" label="Delivery fee (₦)" type="number" min={0} inputMode="numeric" optional state={state} value={fee} onChange={(ev) => setFee(ev.target.value)} />
        <div className="field">
          <label className="label" htmlFor="f-deliveryMethod">Fulfilment</label>
          <select id="f-deliveryMethod" name="deliveryMethod" className="select" defaultValue={(e.deliveryMethod as string) ?? defaultDelivery}>
            {options.map((o) => <option key={o} value={o}>{DELIVERY_LABELS[o]}</option>)}
          </select>
          <FieldError id="f-deliveryMethod-err" errors={state.fieldErrors?.deliveryMethod} />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="f-note">Note to buyer <span className="opt">(optional)</span></label>
        <textarea id="f-note" name="note" className="textarea" maxLength={500} rows={2} defaultValue={(e.note as string) ?? ""} placeholder="Delivery date, grading, packaging…" />
      </div>
      <div className="escrow-total" aria-live="polite">
        <div className="row-between"><span>Buyer pays into escrow</span><strong>{formatPrice(total)}</strong></div>
        {feePercent > 0 && (
          <div className="row-between small muted"><span>You receive after delivery ({feePercent}% AgriTrade fee)</span><span>{formatPrice(total - commission)}</span></div>
        )}
      </div>
      <SubmitButton pendingLabel="Sending…">Send payment request</SubmitButton>
    </form>
  );
}
