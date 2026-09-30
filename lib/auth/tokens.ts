import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

/** 256-bit random token, URL-safe. Only its hash is ever stored in the database. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Compared against when the email is unknown, so response times don't reveal which emails exist.
let dummyHash: Promise<string> | undefined;
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= bcrypt.hash(generateToken(), 12);
  await bcrypt.compare(password, await dummyHash);
}
