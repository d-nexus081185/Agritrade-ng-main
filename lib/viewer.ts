import { getCurrentUser } from "./auth/session";
import { getSavedIds } from "./queries";
import type { Viewer } from "@/components/market/ProductCard";

/** What the current visitor can do with product cards (save, sign-in prompts). */
export async function getViewer(): Promise<Viewer & { user: Awaited<ReturnType<typeof getCurrentUser>> }> {
  const user = await getCurrentUser();
  const canSave = user?.role === "BUYER";
  return { user, isGuest: !user, canSave, savedIds: canSave ? await getSavedIds(user!.id) : new Set() };
}
