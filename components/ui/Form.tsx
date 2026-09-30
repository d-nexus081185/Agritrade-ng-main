"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./Icon";
import type { ActionState } from "@/lib/validation";

export function SubmitButton({
  children,
  pendingLabel = "Working…",
  className = "btn",
  disabled,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-disabled={pending || disabled}>
      {pending ? (
        <>
          <span className="seed-dots" aria-hidden="true"><i /><i /><i /></span>
          <span>{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Form-level success / error message, announced to screen readers. */
export function FormMessage({ state }: { state: ActionState | undefined }) {
  if (!state?.message) return null;
  return (
    <div className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role={state.ok ? "status" : "alert"}>
      <Icon name={state.ok ? "check" : "alert"} />
      <div>
        <p>{state.message}</p>
        {state.devLink && (
          <p className="dev-note" style={{ marginTop: 8 }}>
            Development mode — no email service is configured, so here is the link:{" "}
            <a href={state.devLink}>{state.devLink}</a>
          </p>
        )}
      </div>
    </div>
  );
}

export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="field-error" id={id}>
      <Icon name="alert" size={15} />
      {errors[0]}
    </p>
  );
}

type FieldProps = {
  name: string;
  label: string;
  state?: ActionState;
  hint?: string;
  optional?: boolean;
  children?: ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">;

/** Labelled input with hint and error wiring (aria-invalid / aria-describedby). */
export function TextField({ name, label, state, hint, optional, id, ...rest }: FieldProps) {
  const inputId = id ?? `f-${name}`;
  const errors = state?.fieldErrors?.[name];
  const describedBy = [hint && `${inputId}-hint`, errors?.length && `${inputId}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label className="label" htmlFor={inputId}>
        {label} {optional && <span className="opt">(optional)</span>}
      </label>
      <input
        id={inputId}
        name={name}
        className="input"
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy}
        required={!optional && rest.required !== false}
        {...rest}
      />
      {hint && <p className="hint" id={`${inputId}-hint`}>{hint}</p>}
      <FieldError id={`${inputId}-err`} errors={errors} />
    </div>
  );
}

export function PasswordField({
  name,
  label,
  state,
  autoComplete,
  showStrength = false,
  hint,
}: {
  name: string;
  label: string;
  state?: ActionState;
  autoComplete: string;
  showStrength?: boolean;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const id = `f-${name}`;
  const errors = state?.fieldErrors?.[name];
  const score = passwordScore(value);
  const describedBy = [hint && `${id}-hint`, errors?.length && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          className="input"
          autoComplete={autoComplete}
          required
          minLength={showStrength ? 8 : undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {showStrength && (
        <div className="strength" data-score={value ? score : 0} aria-hidden="true">
          <i /><i /><i /><i />
        </div>
      )}
      {hint && <p className="hint" id={`${id}-hint`}>{hint}</p>}
      <FieldError id={`${id}-err`} errors={errors} />
    </div>
  );
}

export function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/i.test(pw) && /\d/.test(pw)) s++;
  if (pw.length >= 12) s++;
  if (/[^a-z0-9]/i.test(pw) && /[A-Z]/.test(pw)) s++;
  return Math.max(pw ? 1 : 0, s);
}
