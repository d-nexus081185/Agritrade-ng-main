"use client";

import { useActionState } from "react";
import { updateSellerProfileAction } from "@/app/actions/seller";
import { FieldError, FormMessage, SubmitButton, TextField } from "@/components/ui/Form";
import { DELIVERY_LABELS, DELIVERY_OPTIONS, NIGERIAN_STATES } from "@/lib/constants";
import type { ActionState } from "@/lib/validation";

type Values = {
  businessName: string;
  description: string;
  city: string;
  state: string;
  phone: string;
  yearsInBusiness: string;
  deliveryOptions: string[];
};

export function SellerProfileForm({ initial }: { initial: Values }) {
  const [state, action] = useActionState<ActionState, FormData>(updateSellerProfileAction, {});
  const e = state.values ?? {};
  const val = (k: keyof Values) => (e[k] as string | undefined) ?? (initial[k] as string);
  const delivery = (e.deliveryOptions as string[] | undefined) ?? initial.deliveryOptions;
  return (
    <form action={action} noValidate className="card card-pad stack" style={{ ["--stack" as string]: "16px" }}>
      <FormMessage state={state} />
      <TextField name="businessName" label="Business name" state={state} defaultValue={val("businessName")} />
      <div className="field">
        <label className="label" htmlFor="f-description">About your business <span className="opt">(optional)</span></label>
        <textarea id="f-description" name="description" className="textarea" maxLength={1500} defaultValue={val("description")} placeholder="What you produce, your capacity, quality standards and where you supply." />
      </div>
      <div className="field-row">
        <TextField name="city" label="City" state={state} defaultValue={val("city")} />
        <div className="field">
          <label className="label" htmlFor="f-state">State</label>
          <select id="f-state" name="state" className="select" defaultValue={val("state")} aria-invalid={state.fieldErrors?.state ? true : undefined}>
            {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <FieldError id="f-state-err" errors={state.fieldErrors?.state} />
        </div>
      </div>
      <div className="field-row">
        <TextField name="phone" label="Business phone" type="tel" optional state={state} defaultValue={val("phone")} hint="Shown to buyers in inquiry conversations." />
        <TextField name="yearsInBusiness" label="Years in business" type="number" min={0} max={100} optional state={state} defaultValue={val("yearsInBusiness")} />
      </div>
      <fieldset>
        <legend className="label" style={{ marginBottom: 8 }}>Default delivery options</legend>
        <div className="choice-group">
          {DELIVERY_OPTIONS.map((o) => (
            <label key={o} className="choice-pill">
              <input type="checkbox" name="deliveryOptions" value={o} defaultChecked={delivery.includes(o)} />
              <span>{DELIVERY_LABELS[o]}</span>
            </label>
          ))}
        </div>
        <FieldError id="f-delivery-err" errors={state.fieldErrors?.deliveryOptions} />
      </fieldset>
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
      </div>
    </form>
  );
}
