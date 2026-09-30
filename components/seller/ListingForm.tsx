"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { saveListingAction } from "@/app/actions/seller";
import { FieldError, FormMessage, SubmitButton, TextField } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { AVAILABILITY, AVAILABILITY_LABELS, DELIVERY_LABELS, DELIVERY_OPTIONS, NIGERIAN_STATES } from "@/lib/constants";
import type { ActionState } from "@/lib/validation";

export type ListingFormValues = {
  id?: string;
  title: string;
  categoryId: string;
  description: string;
  unit: string;
  price: number | null;
  quantityAvailable: number;
  minOrderQty: number;
  availability: string;
  city: string;
  state: string;
  deliveryOptions: string[];
  images: { id: string; url: string }[];
};

const MAX_PHOTOS = 4;

export function ListingForm({ categories, initial }: { categories: { id: string; name: string }[]; initial: ListingFormValues }) {
  const [state, action] = useActionState<ActionState, FormData>(saveListingAction, {});
  const echoed = state.values ?? {};
  const val = (k: keyof ListingFormValues, fallback: string) => (echoed[k] as string | undefined) ?? fallback;
  const err = state.fieldErrors ?? {};

  const [pricing, setPricing] = useState<"FIXED" | "QUOTE">(initial.price == null && initial.id ? "QUOTE" : "FIXED");
  const [removed, setRemoved] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p)), [previews]);

  const kept = initial.images.filter((i) => !removed.includes(i.id));
  const slotsLeft = MAX_PHOTOS - kept.length;
  const delivery = (echoed.deliveryOptions as string[] | undefined) ?? initial.deliveryOptions;

  const selectProps = (name: string) => ({
    id: `f-${name}`,
    name,
    className: "select",
    "aria-invalid": err[name] ? true : undefined,
    "aria-describedby": err[name] ? `f-${name}-err` : undefined,
  });

  return (
    <form action={action} noValidate className="stack" style={{ ["--stack" as string]: "20px" }}>
      <FormMessage state={state} />
      {initial.id && <input type="hidden" name="listingId" value={initial.id} />}
      {removed.map((id) => <input key={id} type="hidden" name="removeImage" value={id} />)}

      <section className="card card-pad" aria-labelledby="sec-basics">
        <h2 id="sec-basics" style={{ fontSize: "1.2rem" }}>Product basics</h2>
        <TextField name="title" label="Product name" state={state} defaultValue={val("title", initial.title)} maxLength={100} placeholder="e.g. Fresh brown eggs — crate of 30" />
        <div className="field-row" style={{ marginTop: 16 }}>
          <div className="field">
            <label className="label" htmlFor="f-categoryId">Category</label>
            <select {...selectProps("categoryId")} defaultValue={val("categoryId", initial.categoryId)} required>
              <option value="" disabled>Choose a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <FieldError id="f-categoryId-err" errors={err.categoryId} />
          </div>
          <TextField name="unit" label="Unit of sale" state={state} defaultValue={val("unit", initial.unit)} placeholder="crate of 30, 50 kg bag, tuber" maxLength={40} />
        </div>
        <div className="field" style={{ marginTop: 16 }}>
          <label className="label" htmlFor="f-description">Description</label>
          <textarea
            id="f-description"
            name="description"
            className="textarea"
            required
            minLength={20}
            maxLength={2000}
            defaultValue={val("description", initial.description)}
            aria-invalid={err.description ? true : undefined}
            aria-describedby={`f-description-hint${err.description ? " f-description-err" : ""}`}
          />
          <p className="hint" id="f-description-hint">Include size/grade, freshness, packaging and how often you can supply.</p>
          <FieldError id="f-description-err" errors={err.description} />
        </div>
      </section>

      <section className="card card-pad" aria-labelledby="sec-price">
        <h2 id="sec-price" style={{ fontSize: "1.2rem" }}>Price &amp; quantity</h2>
        <fieldset>
          <legend className="label" style={{ marginBottom: 8 }}>Pricing</legend>
          <div className="choice-group">
            <label className="choice-pill">
              <input type="radio" name="pricingMode" value="FIXED" checked={pricing === "FIXED"} onChange={() => setPricing("FIXED")} />
              <span>Fixed price per unit</span>
            </label>
            <label className="choice-pill">
              <input type="radio" name="pricingMode" value="QUOTE" checked={pricing === "QUOTE"} onChange={() => setPricing("QUOTE")} />
              <span>Request a quote</span>
            </label>
          </div>
        </fieldset>
        <div className="field-row" style={{ ["--cols" as string]: 3, marginTop: 16 }}>
          {pricing === "FIXED" ? (
            <TextField
              name="price"
              label="Price per unit (₦)"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              state={state}
              defaultValue={val("price", initial.price?.toString() ?? "")}
            />
          ) : (
            <div className="field">
              <span className="label">Price</span>
              <p className="hint" style={{ paddingTop: 10 }}>Buyers will see “Request a quote”.</p>
            </div>
          )}
          <TextField name="quantityAvailable" label="Quantity available" type="number" inputMode="numeric" min={0} step={1} state={state} defaultValue={val("quantityAvailable", String(initial.quantityAvailable))} />
          <TextField name="minOrderQty" label="Minimum order" type="number" inputMode="numeric" min={1} step={1} state={state} defaultValue={val("minOrderQty", String(initial.minOrderQty))} />
        </div>
        <div className="field" style={{ marginTop: 16 }}>
          <label className="label" htmlFor="f-availability">Availability</label>
          <select {...selectProps("availability")} defaultValue={val("availability", initial.availability)}>
            {AVAILABILITY.map((a) => <option key={a} value={a}>{AVAILABILITY_LABELS[a]}</option>)}
          </select>
        </div>
      </section>

      <section className="card card-pad" aria-labelledby="sec-location">
        <h2 id="sec-location" style={{ fontSize: "1.2rem" }}>Location &amp; delivery</h2>
        <div className="field-row">
          <TextField name="city" label="City / town" state={state} defaultValue={val("city", initial.city)} />
          <div className="field">
            <label className="label" htmlFor="f-state">State</label>
            <select {...selectProps("state")} defaultValue={val("state", initial.state)} required>
              <option value="" disabled>Choose a state</option>
              {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <FieldError id="f-state-err" errors={err.state} />
          </div>
        </div>
        <fieldset style={{ marginTop: 16 }}>
          <legend className="label" style={{ marginBottom: 8 }}>How can buyers receive it?</legend>
          <div className="choice-group">
            {DELIVERY_OPTIONS.map((o) => (
              <label key={o} className="choice-pill">
                <input type="checkbox" name="deliveryOptions" value={o} defaultChecked={delivery.includes(o)} />
                <span>{DELIVERY_LABELS[o]}</span>
              </label>
            ))}
          </div>
          <FieldError id="f-delivery-err" errors={err.deliveryOptions} />
        </fieldset>
      </section>

      <section className="card card-pad" aria-labelledby="sec-photos">
        <h2 id="sec-photos" style={{ fontSize: "1.2rem" }}>Photos</h2>
        <p className="hint" style={{ marginBottom: 14 }}>Up to {MAX_PHOTOS} JPEG, PNG or WebP photos, 4 MB each. Clear, well-lit photos get more inquiries.</p>
        {initial.images.length > 0 && (
          <ul className="row" style={{ listStyle: "none", padding: 0, margin: "0 0 14px" }}>
            {initial.images.map((img) => {
              const isRemoved = removed.includes(img.id);
              return (
                <li key={img.id} style={{ width: 120 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- mixed sources, small thumbnails */}
                  <img src={img.url} alt="" style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 10, opacity: isRemoved ? 0.35 : 1 }} />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ width: "100%", marginTop: 4 }}
                    aria-pressed={isRemoved}
                    onClick={() => setRemoved((r) => (isRemoved ? r.filter((x) => x !== img.id) : [...r, img.id]))}
                  >
                    {isRemoved ? "Undo remove" : "Remove"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="field">
          <label className="label" htmlFor="f-photos"><Icon name="camera" size={16} /> Add photos {slotsLeft <= 0 && <span className="opt">(limit reached)</span>}</label>
          <input
            id="f-photos"
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={slotsLeft <= 0}
            className="input"
            aria-invalid={err.photos ? true : undefined}
            aria-describedby={err.photos ? "f-photos-err" : undefined}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setPreviews(files.slice(0, MAX_PHOTOS).map((f) => URL.createObjectURL(f)));
            }}
          />
          <FieldError id="f-photos-err" errors={err.photos} />
        </div>
        {previews.length > 0 && (
          <div className="row" style={{ marginTop: 12 }} aria-label="Selected photos">
            {previews.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img key={p} src={p} alt="" className="grow-in" style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 10 }} />
            ))}
          </div>
        )}
      </section>

      <div className="row" style={{ justifyContent: "flex-end" }}>
        <Link href="/seller/listings" className="btn btn-ghost">Cancel</Link>
        <SubmitButton pendingLabel="Saving listing…">{initial.id ? "Save changes" : "Submit for review"}</SubmitButton>
      </div>
    </form>
  );
}
