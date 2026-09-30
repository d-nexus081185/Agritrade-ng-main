import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { UPLOAD_URL_PREFIX } from "./constants";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGES_PER_LISTING = 4;

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};


export function uploadDir(): string {
  return path.resolve(process.env.UPLOAD_DIR || "./uploads");
}

/** Checks the file signature, not just the browser-supplied MIME type. */
function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export type SavedUpload = { url: string };

export async function saveListingImages(files: File[]): Promise<{ saved: SavedUpload[]; error?: string }> {
  const real = files.filter((f) => f && f.size > 0);
  if (real.length > MAX_IMAGES_PER_LISTING) return { saved: [], error: `Upload at most ${MAX_IMAGES_PER_LISTING} photos.` };
  const buffers: { buf: Buffer; ext: string }[] = [];
  for (const file of real) {
    if (file.size > MAX_IMAGE_BYTES) return { saved: [], error: `“${file.name}” is larger than 4 MB.` };
    const buf = Buffer.from(await file.arrayBuffer());
    const type = sniff(buf);
    if (!type) return { saved: [], error: `“${file.name}” isn't a JPEG, PNG or WebP image.` };
    buffers.push({ buf, ext: TYPES[type]! });
  }
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const saved: SavedUpload[] = [];
  for (const { buf, ext } of buffers) {
    const name = `${randomBytes(12).toString("hex")}.${ext}`;
    await writeFile(path.join(dir, name), buf);
    saved.push({ url: UPLOAD_URL_PREFIX + name });
  }
  return { saved };
}

export async function deleteUploadedImage(url: string): Promise<void> {
  if (!url.startsWith(UPLOAD_URL_PREFIX)) return; // bundled sample images are never deleted
  const name = path.basename(url);
  await unlink(path.join(uploadDir(), name)).catch(() => undefined);
}

export function contentTypeFor(name: string): string | null {
  const ext = path.extname(name).slice(1).toLowerCase();
  const entry = Object.entries(TYPES).find(([, e]) => e === ext);
  return entry ? entry[0] : null;
}
