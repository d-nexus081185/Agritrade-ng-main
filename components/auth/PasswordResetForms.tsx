"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, resetPasswordAction } from "@/app/actions/auth";
import { FormMessage, PasswordField, SubmitButton, TextField } from "@/components/ui/Form";
import { Sprout } from "@/components/ui/Sprout";
import type { ActionState } from "@/lib/validation";

export function ForgotPasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(forgotPasswordAction, {});
  return (
    <div>
      <h1 style={{ fontSize: "2rem" }}>Forgot your password?</h1>
      <p className="muted">Enter the email you registered with and we&apos;ll send you a link to choose a new one.</p>
      {state.ok ? (
        <div className="stack" style={{ marginTop: 24 }}>
          <Sprout className="grow-in" />
          <FormMessage state={state} />
          <Link href="/?mode=login" className="btn btn-secondary btn-block">Back to sign in</Link>
        </div>
      ) : (
        <form action={action} noValidate className="stack" style={{ marginTop: 24, ["--stack" as string]: "16px" }}>
          <FormMessage state={state} />
          <TextField
            name="email"
            label="Email address"
            type="email"
            autoComplete="email"
            state={state}
            defaultValue={(state.values?.email as string) ?? ""}
          />
          <SubmitButton className="btn btn-block" pendingLabel="Sending link…">Send reset link</SubmitButton>
          <p className="small muted" style={{ textAlign: "center" }}>
            Remembered it? <Link href="/?mode=login">Sign in</Link>
          </p>
        </form>
      )}
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<ActionState, FormData>(resetPasswordAction, {});
  return (
    <div>
      <h1 style={{ fontSize: "2rem" }}>Choose a new password</h1>
      <p className="muted">For your security, this will sign you out on every device.</p>
      <form action={action} noValidate className="stack" style={{ marginTop: 24, ["--stack" as string]: "16px" }}>
        <FormMessage state={state} />
        <input type="hidden" name="token" value={token} />
        <PasswordField
          name="password"
          label="New password"
          autoComplete="new-password"
          state={state}
          showStrength
          hint="At least 8 characters, with a letter and a number."
        />
        <PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" state={state} />
        <SubmitButton className="btn btn-block" pendingLabel="Saving…">Update password</SubmitButton>
      </form>
    </div>
  );
}
