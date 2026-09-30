"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessageAction } from "@/app/actions/marketplace";
import { FieldError, FormMessage, SubmitButton } from "@/components/ui/Form";
import type { ActionState } from "@/lib/validation";

export function MessageForm({ inquiryId, placeholder }: { inquiryId: string; placeholder: string }) {
  const [state, action] = useActionState<ActionState, FormData>(sendMessageAction, {});
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.focus();
  }, [state]);
  return (
    <form action={action} className="stack" style={{ ["--stack" as string]: "12px" }}>
      {!state.ok && <FormMessage state={state} />}
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <label htmlFor="reply" className="label">Your message</label>
      <textarea
        ref={ref}
        id="reply"
        name="body"
        className="textarea"
        required
        maxLength={2000}
        placeholder={placeholder}
        defaultValue={state.ok ? "" : ((state.values?.body as string) ?? "")}
        aria-invalid={state.fieldErrors?.body ? true : undefined}
        aria-describedby={state.fieldErrors?.body ? "reply-err" : undefined}
      />
      <FieldError id="reply-err" errors={state.fieldErrors?.body} />
      <div className="row-between">
        <span className="small muted" role="status">{state.ok ? "Message sent." : ""}</span>
        <SubmitButton pendingLabel="Sending…">Send message</SubmitButton>
      </div>
    </form>
  );
}
