"use client";

import { useActionState } from "react";
import { createInquiryAction } from "@/app/actions/marketplace";
import { FieldError, FormMessage, SubmitButton } from "@/components/ui/Form";
import { DELIVERY_LABELS, type DeliveryOption } from "@/lib/constants";
import type { ActionState } from "@/lib/validation";

export function InquiryForm({
  productId,
  unit,
  minOrderQty,
  deliveryOptions,
}: {
  productId: string;
  unit: string;
  minOrderQty: number;
  deliveryOptions: DeliveryOption[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(createInquiryAction, {});
  const v = state.values ?? {};
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="stack" style={{ ["--stack" as string]: "14px" }}>
      <FormMessage state={state} />
      <input type="hidden" name="productId" value={productId} />
      <div className="field-row">
        <div className="field">
          <label className="label" htmlFor="inq-qty">Quantity ({unit})</label>
          <input
            id="inq-qty"
            name="quantity"
            type="number"
            inputMode="numeric"
            min={minOrderQty}
            step={1}
            required
            className="input"
            defaultValue={(v.quantity as string) ?? String(minOrderQty)}
            aria-invalid={err.quantity ? true : undefined}
            aria-describedby={`inq-qty-hint${err.quantity ? " inq-qty-err" : ""}`}
          />
          <p className="hint" id="inq-qty-hint">Minimum {minOrderQty}.</p>
          <FieldError id="inq-qty-err" errors={err.quantity} />
        </div>
        <fieldset className="field">
          <legend className="label" style={{ marginBottom: 6 }}>Delivery or pickup</legend>
          <div className="choice-group">
            {deliveryOptions.map((o, i) => (
              <label key={o} className="choice-pill">
                <input type="radio" name="deliveryPreference" value={o} defaultChecked={(v.deliveryPreference as string) ? v.deliveryPreference === o : i === 0} />
                <span>{DELIVERY_LABELS[o]}</span>
              </label>
            ))}
          </div>
          <FieldError id="inq-del-err" errors={err.deliveryPreference} />
        </fieldset>
      </div>
      <div className="field">
        <label className="label" htmlFor="inq-msg">Message to the seller</label>
        <textarea
          id="inq-msg"
          name="message"
          className="textarea"
          required
          minLength={10}
          maxLength={2000}
          placeholder="E.g. We need this weekly for our supermarket in Ikeja. Can you deliver on Mondays? What's your best price for 100 units?"
          defaultValue={(v.message as string) ?? ""}
          aria-invalid={err.message ? true : undefined}
          aria-describedby={err.message ? "inq-msg-err" : undefined}
        />
        <FieldError id="inq-msg-err" errors={err.message} />
      </div>
      <SubmitButton className="btn btn-block" pendingLabel="Sending inquiry…">Send inquiry</SubmitButton>
      <p className="hint">The seller replies in your AgriTrade inbox. No payment is taken on the platform.</p>
    </form>
  );
}
