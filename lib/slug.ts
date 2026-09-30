import { randomBytes } from "node:crypto";
import { slugify } from "./format";

/** Returns `base` slugified, suffixed with a short random tag if `taken` reports a clash. */
export async function uniqueSlug(base: string, taken: (slug: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || "item";
  if (!(await taken(root))) return root;
  for (let i = 0; i < 5; i++) {
    const candidate = `${root}-${randomBytes(3).toString("hex")}`;
    if (!(await taken(candidate))) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}
