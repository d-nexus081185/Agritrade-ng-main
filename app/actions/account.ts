"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { hashPassword, hashToken, verifyPassword } from "@/lib/auth/tokens";
import { SESSION_COOKIE } from "@/lib/constants";
import { accountSchema, changePasswordSchema, setPasswordSchema, fieldError, fieldErrorsOf, formToObject, type ActionState } from "@/lib/validation";

export async function updateAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const raw = formToObject(formData);
  const parsed = accountSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  const v = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: { name: v.name, phone: v.phone ?? null, companyName: v.companyName ?? null, city: v.city ?? null, state: v.state ?? null },
  });
  revalidatePath("/account");
  return { ok: true, message: "Account details saved." };
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const raw = formToObject(formData);
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });

  // Accounts created through Google/Facebook set their first password without a current one.
  if (!record.passwordHash) {
    const parsed = setPasswordSchema.safeParse(raw);
    if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
    revalidatePath("/account");
    return { ok: true, message: "Password set. You can now also sign in with your email and password." };
  }

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) return fieldErrorsOf(parsed.error, raw);
  if (!(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    return fieldError("currentPassword", "That's not your current password.");
  }

  const current = (await cookies()).get(SESSION_COOKIE)?.value;
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    // Keep this device signed in; sign out every other session.
    db.session.deleteMany({ where: { userId: user.id, NOT: current ? { tokenHash: hashToken(current) } : undefined } }),
  ]);
  return { ok: true, message: "Password updated. Other devices have been signed out." };
}
