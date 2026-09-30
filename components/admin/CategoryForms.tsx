"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteCategoryAction, saveCategoryAction } from "@/app/actions/admin";
import { FormMessage, SubmitButton, TextField } from "@/components/ui/Form";
import type { ActionState } from "@/lib/validation";

type CategoryValues = { id?: string; name: string; description: string; imageUrl: string; sortOrder: number };

export function CategoryForm({ initial }: { initial: CategoryValues }) {
  const [state, action] = useActionState<ActionState, FormData>(saveCategoryAction, {});
  const e = state.values ?? {};
  const prefix = initial.id ?? "new";
  const val = (k: keyof CategoryValues) => (e[k] as string | undefined) ?? String(initial[k] ?? "");
  return (
    <form action={action} noValidate className="stack" style={{ ["--stack" as string]: "14px" }}>
      <FormMessage state={state} />
      {initial.id && <input type="hidden" name="categoryId" value={initial.id} />}
      <TextField id={`${prefix}-name`} name="name" label="Name" state={state} defaultValue={val("name")} maxLength={50} />
      <div className="field">
        <label className="label" htmlFor={`${prefix}-desc`}>Description <span className="opt">(optional)</span></label>
        <textarea id={`${prefix}-desc`} name="description" className="textarea" style={{ minHeight: 70 }} maxLength={300} defaultValue={val("description")} />
      </div>
      <div className="field-row">
        <TextField id={`${prefix}-img`} name="imageUrl" label="Image path" optional state={state} defaultValue={val("imageUrl")} placeholder="/images/eggs-crate.jpg" />
        <TextField id={`${prefix}-order`} name="sortOrder" label="Sort order" type="number" min={0} max={999} state={state} defaultValue={val("sortOrder")} />
      </div>
      <SubmitButton className="btn btn-sm" pendingLabel="Saving…">{initial.id ? "Save category" : "Add category"}</SubmitButton>
    </form>
  );
}

export function DeleteCategoryButton({ id, name, disabled }: { id: string; name: string; disabled: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="row">
      <button
        type="button"
        className="btn btn-danger-outline btn-sm"
        disabled={disabled || pending}
        onClick={() => {
          if (!window.confirm(`Delete the “${name}” category?`)) return;
          start(async () => {
            const res = await deleteCategoryAction(id);
            setError(res.error ?? null);
          });
        }}
      >
        Delete category
      </button>
      {disabled && <span className="small muted">Categories with listings can&apos;t be deleted.</span>}
      {error && <span className="small" role="alert" style={{ color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}
