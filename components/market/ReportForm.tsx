"use client";

import { useActionState, useState } from "react";
import { reportListingAction } from "@/app/actions/marketplace";
import { FieldError, FormMessage, SubmitButton } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { REPORT_REASONS, REPORT_REASON_LABELS } from "@/lib/constants";
import type { ActionState } from "@/lib/validation";

export function ReportForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(reportListingAction, {});

  if (state.ok) return <FormMessage state={state} />;

  return (
    <div>
      <button type="button" className="btn btn-ghost btn-sm" aria-expanded={open} aria-controls="report-form" onClick={() => setOpen((o) => !o)}>
        <Icon name="flag" size={15} /> Report this listing
      </button>
      {open && (
        <form id="report-form" action={action} className="stack grow-in" style={{ marginTop: 12, ["--stack" as string]: "12px" }}>
          <FormMessage state={state} />
          <input type="hidden" name="productId" value={productId} />
          <div className="field">
            <label className="label" htmlFor="report-reason">Reason</label>
            <select id="report-reason" name="reason" className="select" required defaultValue="">
              <option value="" disabled>Choose a reason</option>
              {REPORT_REASONS.map((r) => <option key={r} value={r}>{REPORT_REASON_LABELS[r]}</option>)}
            </select>
            <FieldError id="report-reason-err" errors={state.fieldErrors?.reason} />
          </div>
          <div className="field">
            <label className="label" htmlFor="report-details">Details <span className="opt">(optional)</span></label>
            <textarea id="report-details" name="details" className="textarea" maxLength={1000} style={{ minHeight: 80 }} />
          </div>
          <SubmitButton className="btn btn-danger-outline btn-sm" pendingLabel="Sending…">Submit report</SubmitButton>
        </form>
      )}
    </div>
  );
}
