"use client";

import { useActionState } from "react";
import { changePasswordAction, updateAccountAction } from "@/app/actions/account";
import { FieldError, FormMessage, PasswordField, SubmitButton, TextField } from "@/components/ui/Form";
import { NIGERIAN_STATES } from "@/lib/constants";
import type { ActionState } from "@/lib/validation";

type AccountValues = { name: string; phone: string; companyName: string; city: string; state: string };

export function AccountForm({ initial, role }: { initial: AccountValues; role: string }) {
  const [state, action] = useActionState<ActionState, FormData>(updateAccountAction, {});
  const e = state.values ?? {};
  const val = (k: keyof AccountValues) => (e[k] as string | undefined) ?? initial[k];
  return (
    <form action={action} noValidate className="stack" style={{ ["--stack" as string]: "16px" }}>
      <FormMessage state={state} />
      <TextField name="name" label="Full name" autoComplete="name" state={state} defaultValue={val("name")} />
      <TextField name="phone" label="Phone" type="tel" autoComplete="tel" optional state={state} defaultValue={val("phone")} />
      {role === "BUYER" && (
        <TextField name="companyName" label="Shop or business name" optional state={state} defaultValue={val("companyName")} hint="Sellers see this when you send an inquiry." />
      )}
      <div className="field-row">
        <TextField name="city" label="City" optional state={state} defaultValue={val("city")} />
        <div className="field">
          <label className="label" htmlFor="acc-state">State <span className="opt">(optional)</span></label>
          <select id="acc-state" name="state" className="select" defaultValue={val("state")} aria-invalid={state.fieldErrors?.state ? true : undefined}>
            <option value="">—</option>
            {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <FieldError id="acc-state-err" errors={state.fieldErrors?.state} />
        </div>
      </div>
      <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>
    </form>
  );
}

export function ChangePasswordForm({ hasPassword = true }: { hasPassword?: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(changePasswordAction, {});
  return (
    <form action={action} noValidate className="stack" style={{ ["--stack" as string]: "16px" }} key={state.ok ? "done" : "form"}>
      <FormMessage state={state} />
      {hasPassword && <PasswordField name="currentPassword" label="Current password" autoComplete="current-password" state={state} />}
      <PasswordField name="password" label="New password" autoComplete="new-password" state={state} showStrength hint="At least 8 characters, with a letter and a number." />
      <PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" state={state} />
      <SubmitButton className="btn btn-secondary" pendingLabel="Updating…">{hasPassword ? "Update password" : "Set password"}</SubmitButton>
    </form>
  );
}
